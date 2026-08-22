import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derivedKey = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== 'string' || !encodedHash.startsWith('scrypt:')) return false;
  const [, salt, expectedHex] = encodedHash.split(':');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(String(password), salt, PASSWORD_KEY_LENGTH);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function sessionExpiresAt(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    vendorIds: [...(user.vendorIds || [])],
  };
}
