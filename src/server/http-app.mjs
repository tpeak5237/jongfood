import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { DomainError } from './memory-store.mjs';

const MAX_BODY_BYTES = 1_000_000;
const SESSION_COOKIE = 'jongfood_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; base-uri 'self'; form-action 'self'",
};

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || !rawValue.length) continue;
    cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join('='));
  }
  return cookies;
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(JSON.stringify(payload));
}

function sendError(response, error) {
  const status = error instanceof DomainError ? error.status : error.statusCode || 500;
  const code = error instanceof DomainError ? error.code : 'INTERNAL_ERROR';
  if (status >= 500) console.error(error);
  sendJson(response, status, { error: { code, message: status >= 500 ? 'Something went wrong. Try again.' : error.message, details: error.details } });
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new DomainError('REQUEST_TOO_LARGE', 'Request body is too large.', 413);
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new DomainError('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }
}

function setSessionCookie(token, secure) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure ? '; Secure' : ''}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

async function serveStatic(root, requestPath, response) {
  const decoded = decodeURIComponent(requestPath || '/');
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const safePath = normalize(relative);
  const filePath = safePath.startsWith('..') ? join(root, 'index.html') : join(root, safePath);
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { ...securityHeaders, 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch {
    const fallback = await readFile(join(root, 'index.html'));
    response.writeHead(200, { ...securityHeaders, 'Content-Type': contentTypes['.html'], 'Cache-Control': 'no-cache' });
    response.end(fallback);
  }
}

export function createJongFoodServer({ store, root }) {
  if (!store) throw new Error('A store is required.');
  const secureCookies = process.env.NODE_ENV === 'production' || String(process.env.APP_URL || '').startsWith('https://');

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      response.setHeader('Vary', 'Cookie');
      if (url.pathname.startsWith('/api/')) {
        if (request.method === 'OPTIONS') {
          response.writeHead(204, { ...securityHeaders, Allow: 'GET,POST,PATCH,OPTIONS' });
          response.end();
          return;
        }
        const cookies = parseCookies(request.headers.cookie);
        const currentUser = await store.getSession(cookies[SESSION_COOKIE]);
        const requireUser = () => {
          if (!currentUser) throw new DomainError('UNAUTHENTICATED', 'Sign in to continue.', 401);
          return currentUser;
        };
        const method = request.method || 'GET';
        if (method === 'GET' && url.pathname === '/api/health') {
          sendJson(response, 200, { ok: true, store: store.kind });
          return;
        }
        if (method === 'GET' && url.pathname === '/api/session') {
          sendJson(response, 200, { authenticated: Boolean(currentUser), user: currentUser || null });
          return;
        }
        if (method === 'POST' && url.pathname === '/api/auth/login') {
          const body = await readJson(request);
          const user = await store.authenticate(body.email, body.password);
          const session = await store.createSession(user.id);
          sendJson(response, 200, { user }, { 'Set-Cookie': setSessionCookie(session.token, secureCookies) });
          return;
        }
        if (method === 'POST' && url.pathname === '/api/auth/logout') {
          await store.deleteSession(cookies[SESSION_COOKIE]);
          sendJson(response, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
          return;
        }
        if (method === 'GET' && url.pathname === '/api/bootstrap') {
          sendJson(response, 200, await store.bootstrap(requireUser()));
          return;
        }
        if (method === 'POST' && url.pathname === '/api/orders') {
          const user = requireUser();
          const body = await readJson(request);
          const idempotencyKey = request.headers['idempotency-key'] || body.idempotencyKey;
          sendJson(response, 201, await store.createOrder(user, { ...body, idempotencyKey }), { Location: '/api/bootstrap' });
          return;
        }
        const statusMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
        if (method === 'PATCH' && statusMatch) {
          const user = requireUser();
          const body = await readJson(request);
          sendJson(response, 200, { order: await store.updateOrderStatus(user, decodeURIComponent(statusMatch[1]), body.status) });
          return;
        }
        const pickupMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/pickup$/);
        if (method === 'POST' && pickupMatch) {
          const user = requireUser();
          sendJson(response, 200, { order: await store.pickupOrder(user, decodeURIComponent(pickupMatch[1])) });
          return;
        }
        const pauseMatch = url.pathname.match(/^\/api\/vendors\/([^/]+)\/pause$/);
        if (method === 'POST' && pauseMatch) {
          const user = requireUser();
          const body = await readJson(request);
          sendJson(response, 200, await store.setVendorPaused(user, decodeURIComponent(pauseMatch[1]), Boolean(body.paused)));
          return;
        }
        const availabilityMatch = url.pathname.match(/^\/api\/menu-items\/([^/]+)\/availability$/);
        if (method === 'PATCH' && availabilityMatch) {
          const user = requireUser();
          const body = await readJson(request);
          sendJson(response, 200, await store.setMenuItemAvailability(user, decodeURIComponent(availabilityMatch[1]), Boolean(body.available)));
          return;
        }
        sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
        return;
      }
      await serveStatic(root, url.pathname, response);
    } catch (error) {
      sendError(response, error);
    }
  });
}
