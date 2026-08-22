import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let createdOrderId;
let createdOrderRef;

async function signIn(page, email, password) {
  await page.goto('/');
  await page.getByLabel('อีเมล').fill(email);
  await page.getByLabel('รหัสผ่าน').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByRole('banner')).toBeVisible();
}

test('student validates required modifiers before adding an item', async ({ page }) => {
  await signIn(page, 'student@demo.jongfood.local', 'demo-student');
  await page.getByRole('button', { name: 'เพิ่ม กะเพราไก่ไข่ดาว' }).click();
  await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('กรุณาเลือกตัวเลือกที่จำเป็น');
  await page.getByLabel(/ระดับความเผ็ด/).selectOption('medium');
  await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await expect(page.getByRole('complementary')).toContainText('กะเพราไก่ไข่ดาว');
});

test('student creates a pickup order and sees it after reload', async ({ page }) => {
  await signIn(page, 'student@demo.jongfood.local', 'demo-student');
  await page.getByRole('button', { name: 'เพิ่ม ข้าวหมูกรอบคั่วพริกเกลือ' }).click();
  await page.getByRole('button', { name: /11:35–11:40/ }).click();
  await page.getByRole('button', { name: 'ยืนยันการจอง' }).click();
  await expect(page.getByRole('heading', { name: 'ออเดอร์ของฉัน' }).last()).toBeVisible();
  const reference = await page.locator('.order-reference').first().textContent();
  createdOrderRef = reference.match(/JF-\d+/)?.[0];
  expect(createdOrderRef).toMatch(/^JF-/);
  const bootstrap = await page.request.get('/api/bootstrap');
  const bootstrapBody = await bootstrap.json();
  createdOrderId = bootstrapBody.orders.find((order) => order.ref === createdOrderRef)?.id;
  expect(createdOrderId).toBeTruthy();
  await page.reload();
  await page.getByRole('banner').getByRole('button', { name: /ออเดอร์ของฉัน/ }).click();
  await expect(page.locator('.order-reference').filter({ hasText: createdOrderRef })).toBeVisible();
});

test('the first pickup slot exhausts server capacity', async ({ page }) => {
  await signIn(page, 'student@demo.jongfood.local', 'demo-student');
  const response = await page.request.post('/api/orders', {
    headers: { 'Idempotency-Key': 'e2e-capacity-11111111' },
    data: { vendorId: 'bai-tong', pickupSlotId: 'bai-tong-slot-1', orderType: 'PREORDER', items: [{ menuItemId: 'bai-2', quantity: 1, modifiers: [] }] },
  });
  expect(response.status()).toBe(201);
  const exhausted = await page.request.post('/api/orders', {
    headers: { 'Idempotency-Key': 'e2e-capacity-22222222' },
    data: { vendorId: 'bai-tong', pickupSlotId: 'bai-tong-slot-1', orderType: 'PREORDER', items: [{ menuItemId: 'bai-2', quantity: 1, modifiers: [] }] },
  });
  expect(exhausted.status()).toBe(409);
  expect((await exhausted.json()).error.code).toBe('CAPACITY_EXHAUSTED');
});

test('vendor processes the order through preparing and ready', async ({ page }) => {
  await signIn(page, 'staff@bai-tong.demo.jongfood.local', 'demo-staff');
  await page.getByRole('button', { name: 'หลังร้าน' }).click();
  await page.getByRole('tab', { name: 'คิวครัว' }).click();
  const card = page.locator('.queue-card').filter({ hasText: createdOrderRef });
  await expect(card).toBeVisible();
  await card.getByRole('button').click();
  await card.getByRole('button', { name: 'กำลังทำ' }).click();
  await card.getByRole('button', { name: 'พร้อมรับ' }).click();
  await expect(card).toContainText('รับแล้ว');
});

test('student sees ready status and completes pickup', async ({ page }) => {
  await signIn(page, 'student@demo.jongfood.local', 'demo-student');
  await page.getByRole('banner').getByRole('button', { name: /ออเดอร์ของฉัน/ }).click();
  const card = page.locator('.order-tracker').filter({ hasText: createdOrderRef });
  await expect(card).toContainText('พร้อมรับ');
  await card.getByTestId('pickup-order').click();
  await expect(page.locator('.history-row').filter({ hasText: createdOrderRef })).toContainText('รับแล้ว');
});

test('mobile student surface has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'student@demo.jongfood.local', 'demo-student');
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
});
