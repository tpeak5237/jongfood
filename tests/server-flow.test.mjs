import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createJongFoodServer } from '../src/server/http-app.mjs';
import { createMemoryStore } from '../src/server/memory-store.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function startTestServer() {
  const store = createMemoryStore();
  const server = createJongFoodServer({ store, root });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { store, server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';', 1)[0];
  return cookie;
}

async function createOrder(baseUrl, cookie, key, itemId = 'bai-2', slotId = 'bai-tong-slot-1') {
  return fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify({ vendorId: 'bai-tong', pickupSlotId: slotId, orderType: 'PREORDER', paymentMethod: 'PAY_AT_PICKUP', items: [{ menuItemId: itemId, quantity: 1, modifiers: [] }] }) });
}

test('server protects modifiers, capacity, idempotency, and vendor tenancy', async (t) => {
  const { store, server, baseUrl } = await startTestServer();
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await store.close();
  });

  const studentCookie = await login(baseUrl, 'student@demo.jongfood.local', 'demo-student');
  const missingModifier = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: { Cookie: studentCookie, 'Content-Type': 'application/json', 'Idempotency-Key': 'missing-modifier-111111' }, body: JSON.stringify({ vendorId: 'bai-tong', pickupSlotId: 'bai-tong-slot-2', items: [{ menuItemId: 'bai-1', quantity: 1, modifiers: [] }] }) });
  assert.equal(missingModifier.status, 422);
  assert.equal((await missingModifier.json()).error.code, 'REQUIRED_MODIFIER');

  const key = 'capacity-order-111111';
  const first = await createOrder(baseUrl, studentCookie, key);
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  const replay = await createOrder(baseUrl, studentCookie, key);
  assert.equal(replay.status, 201);
  assert.equal((await replay.json()).order.id, firstBody.order.id);
  const exhausted = await createOrder(baseUrl, studentCookie, 'capacity-order-222222', 'bai-3');
  assert.equal(exhausted.status, 409);
  assert.equal((await exhausted.json()).error.code, 'CAPACITY_EXHAUSTED');

  const staffCookie = await login(baseUrl, 'staff@khlong.demo.jongfood.local', 'demo-staff');
  const forbidden = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(firstBody.order.id)}/status`, { method: 'PATCH', headers: { Cookie: staffCookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CONFIRMED' }) });
  assert.equal(forbidden.status, 403);
});
