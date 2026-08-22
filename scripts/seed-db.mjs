import { createPostgresStore } from '../src/server/postgres-store.mjs';
import { hashPassword } from '../src/server/auth.mjs';
import { createSeedData } from '../src/server/seed.mjs';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for demo seed data.');
const store = createPostgresStore({ connectionString: process.env.DATABASE_URL });
const data = createSeedData();
const client = await store.pool.connect();

try {
  await client.query('BEGIN');
  await client.query('INSERT INTO organizations (id, slug, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name', [data.organization.id, data.organization.slug, data.organization.name]);
  await client.query('INSERT INTO campuses (id, organization_id, name, city, time_zone, currency) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city', [data.campus.id, data.organization.id, JSON.stringify(data.campus.name), data.campus.city, data.campus.timeZone, data.campus.currency]);
  for (const user of data.users) {
    await client.query('INSERT INTO users (id, organization_id, email, password_hash, display_name, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name, role = EXCLUDED.role', [user.id, user.organizationId, user.email, hashPassword(user.password, `seed-${user.id}`), JSON.stringify(user.displayName), user.role]);
  }
  for (const vendor of data.vendors) {
    await client.query('INSERT INTO vendors (id, organization_id, campus_id, slug, name, description, emoji, image_url, service_open, settings) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url, settings = EXCLUDED.settings', [vendor.id, vendor.organizationId, vendor.campusId, vendor.slug, JSON.stringify(vendor.name), JSON.stringify(vendor.description), vendor.emoji, vendor.image, vendor.serviceOpen, JSON.stringify(vendor.settings)]);
    await client.query('INSERT INTO vendor_staff (organization_id, vendor_id, user_id, staff_role) SELECT $1, $2, id, \'STAFF\' FROM users WHERE id = ANY($3::text[]) ON CONFLICT DO NOTHING', [vendor.organizationId, vendor.id, data.users.filter((user) => user.vendorIds?.includes(vendor.id)).map((user) => user.id)]);
    const menuId = `${vendor.id}-menu`;
    await client.query('INSERT INTO menus (id, organization_id, vendor_id, name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [menuId, vendor.organizationId, vendor.id, JSON.stringify({ th: 'เมนูวันนี้', en: "Today's menu" })]);
    const categories = new Map();
    vendor.menu.forEach((item, index) => {
      if (!categories.has(item.category)) categories.set(item.category, `${vendor.id}-category-${categories.size + 1}`);
      const categoryId = categories.get(item.category);
      void index;
      return categoryId;
    });
    for (const [category, categoryId] of categories) await client.query('INSERT INTO menu_categories (id, organization_id, menu_id, name, sort_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order', [categoryId, vendor.organizationId, menuId, JSON.stringify({ th: category.split(' / ')[0], en: category.split(' / ')[1] || category }), Number(categoryId.split('-').pop())]);
    for (const item of vendor.menu) {
      const categoryId = categories.get(item.category);
      await client.query('INSERT INTO menu_items (id, organization_id, vendor_id, menu_id, category_id, name, description, price_minor, capacity_units, emoji, image_url, available, preparation_minutes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price_minor = EXCLUDED.price_minor, capacity_units = EXCLUDED.capacity_units, available = EXCLUDED.available', [item.id, vendor.organizationId, vendor.id, menuId, categoryId, JSON.stringify(item.name), JSON.stringify(item.description), item.priceMinor, item.capacityUnits, item.emoji, item.image, item.available]);
      for (const modifier of item.modifiers || []) {
        await client.query('INSERT INTO menu_modifiers (id, organization_id, vendor_id, menu_item_id, name, required) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, required = EXCLUDED.required', [modifier.id, vendor.organizationId, vendor.id, item.id, JSON.stringify(modifier.name), modifier.required]);
        for (const choice of modifier.options || []) await client.query('INSERT INTO menu_modifier_options (id, organization_id, modifier_id, name, price_minor, capacity_units) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price_minor = EXCLUDED.price_minor, capacity_units = EXCLUDED.capacity_units', [choice.id, vendor.organizationId, modifier.id, JSON.stringify(choice.name), choice.priceMinor, choice.capacityUnits]);
      }
    }
  }
  for (const slot of data.slots) {
    await client.query('INSERT INTO pickup_slots (id, organization_id, vendor_id, service_date, label, cutoff_at, starts_at, ends_at, max_orders, max_capacity_units, booked_orders, booked_capacity_units, closed) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, max_orders = EXCLUDED.max_orders, max_capacity_units = EXCLUDED.max_capacity_units', [slot.id, data.organization.id, slot.vendorId, slot.label, new Date(Date.now() + 5 * 60_000), slot.startsAt, slot.endsAt, slot.maxOrders, slot.maxCapacityUnits, slot.bookedOrders, slot.bookedCapacityUnits, slot.closed]);
  }
  for (const order of data.orders) {
    await client.query('INSERT INTO orders (id, organization_id, vendor_id, owner_id, pickup_slot_id, order_ref, queue_number, order_type, status, subtotal_minor, service_fee_minor, total_minor, capacity_units, payment_method, payment_status, estimated_ready_at, created_at, confirmed_at, ready_at, collected_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ON CONFLICT (id) DO NOTHING', [order.id, order.organizationId, order.vendorId, order.ownerId, order.slotId, order.ref, order.queueNumber, order.orderType, order.status, order.subtotalMinor, order.serviceFeeMinor, order.totalMinor, order.capacityUnits, order.paymentMethod, order.paymentStatus, order.estimatedReadyAt, order.createdAt, order.confirmedAt, order.readyAt, order.collectedAt]);
    for (const item of order.items) await client.query('INSERT INTO order_items (organization_id, order_id, vendor_id, menu_item_id, item_name, quantity, price_minor, capacity_units, modifiers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING', [order.organizationId, order.id, order.vendorId, item.itemId, JSON.stringify(item.name), item.quantity, item.priceMinor, item.capacityUnits, JSON.stringify(item.modifiers || [])]);
    for (const event of order.statusHistory) await client.query('INSERT INTO order_status_events (organization_id, order_id, actor_id, to_status, created_at) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM order_status_events WHERE organization_id = $1 AND order_id = $2 AND to_status = $4 AND created_at = $5)', [order.organizationId, order.id, order.ownerId, event.status, event.at]);
    await client.query('INSERT INTO payments (id, organization_id, order_id, method, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [`payment-${order.id}`, order.organizationId, order.id, order.paymentMethod, order.paymentStatus]);
  }
  for (const [vendorId, nextValue] of data.nextQueueNumber) await client.query('INSERT INTO vendor_queue_sequences (organization_id, vendor_id, service_date, next_value) VALUES ($1, $2, CURRENT_DATE, $3) ON CONFLICT (organization_id, vendor_id, service_date) DO UPDATE SET next_value = GREATEST(vendor_queue_sequences.next_value, EXCLUDED.next_value)', [data.organization.id, vendorId, nextValue]);
  await client.query('COMMIT');
  console.log('Demo data seeded.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  client.release();
  await store.close();
}
