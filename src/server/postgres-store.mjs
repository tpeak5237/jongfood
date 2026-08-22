import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  calculateCartTotals,
  calculateWaitEstimate,
  canTransitionOrderStatus,
} from '../domain.mjs';
import {
  createSessionToken,
  hashSessionToken,
  publicUser,
  sessionExpiresAt,
  verifyPassword,
} from './auth.mjs';
import { DomainError, normalizeSelectedModifiers } from './memory-store.mjs';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'];

const json = (value) => value || {};
const decimal = (value) => Number(value || 0);
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function rowUser(row, vendorIds = []) {
  if (!row) return null;
  return publicUser({
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    displayName: json(row.display_name),
    role: row.role,
    vendorIds,
  });
}

function publicOrder(order, items, statusHistory) {
  return {
    id: order.id,
    organizationId: order.organization_id,
    vendorId: order.vendor_id,
    shopId: order.vendor_id,
    ownerId: order.owner_id,
    ref: order.order_ref,
    queueNumber: order.queue_number,
    orderType: order.order_type,
    status: order.status,
    items: items.map((item) => ({
      menuItemId: item.menu_item_id,
      itemId: item.menu_item_id,
      name: json(item.item_name),
      quantity: item.quantity,
      priceMinor: item.price_minor,
      capacityUnits: decimal(item.capacity_units),
      modifiers: json(item.modifiers),
    })),
    subtotalMinor: order.subtotal_minor,
    serviceFeeMinor: order.service_fee_minor,
    totalMinor: order.total_minor,
    capacityUnits: decimal(order.capacity_units),
    slotId: order.pickup_slot_id,
    slotLabel: order.slot_label,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    confirmedAt: order.confirmed_at,
    estimatedReadyAt: order.estimated_ready_at,
    readyAt: order.ready_at,
    collectedAt: order.collected_at,
    updatedAt: order.updated_at,
    statusHistory,
  };
}

function manageVendor(user, vendorId) {
  return ['MANAGER', 'ORG_ADMIN'].includes(user.role) || (user.role === 'VENDOR_STAFF' && user.vendorIds.includes(vendorId));
}

async function readMigration(migrationPath) {
  return readFile(migrationPath, 'utf8');
}

export async function migratePool(pool, migrationPath = new URL('../../db/migrations/001_initial.sql', import.meta.url)) {
  const sql = await readMigration(migrationPath);
  await pool.query(sql);
}

export function createPostgresStore({ connectionString, autoMigrate = false, migrationPath } = {}) {
  if (!connectionString) throw new Error('DATABASE_URL is required for the PostgreSQL store.');
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });

  async function vendorIdsFor(client, user) {
    if (['MANAGER', 'ORG_ADMIN'].includes(user.role)) {
      const result = await client.query('SELECT id FROM vendors WHERE organization_id = $1 ORDER BY id', [user.organizationId]);
      return result.rows.map((row) => row.id);
    }
    const result = await client.query('SELECT vendor_id FROM vendor_staff WHERE organization_id = $1 AND user_id = $2 ORDER BY vendor_id', [user.organizationId, user.id]);
    return result.rows.map((row) => row.vendor_id);
  }

  async function userById(client, id) {
    const result = await client.query('SELECT id, organization_id, email, display_name, role FROM users WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return rowUser(row, await vendorIdsFor(client, { id: row.id, organizationId: row.organization_id, role: row.role }));
  }

  async function loadCatalog(client, organizationId, allowedVendorIds = null) {
    const vendorFilter = allowedVendorIds ? 'AND v.id = ANY($2::text[])' : '';
    const params = allowedVendorIds ? [organizationId, allowedVendorIds] : [organizationId];
    const vendorsResult = await client.query(`
      SELECT v.id, v.slug, v.campus_id, v.name, v.description, v.emoji, v.image_url, v.service_open, v.settings,
             c.name AS campus_name, c.city, c.time_zone, c.currency
      FROM vendors v
      JOIN campuses c ON c.organization_id = v.organization_id AND c.id = v.campus_id
      WHERE v.organization_id = $1 ${vendorFilter}
      ORDER BY v.id
    `, params);
    const vendors = vendorsResult.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      organizationId,
      campusId: row.campus_id,
      name: json(row.name),
      description: json(row.description),
      emoji: row.emoji,
      image: row.image_url,
      serviceOpen: row.service_open,
      settings: json(row.settings),
      menu: [],
      slots: [],
      campus: { name: json(row.campus_name), city: row.city, timeZone: row.time_zone, currency: row.currency },
    }));
    const vendorIds = vendors.map((vendor) => vendor.id);
    if (!vendorIds.length) return vendors;
    const items = await client.query(`
      SELECT mi.id, mi.vendor_id, mi.name, mi.description, mi.price_minor, mi.capacity_units, mi.emoji, mi.image_url,
             mi.available, COALESCE(mc.name, '{}'::jsonb) AS category
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.organization_id = mi.organization_id AND mc.id = mi.category_id
      WHERE mi.organization_id = $1 AND mi.vendor_id = ANY($2::text[])
      ORDER BY mi.vendor_id, mi.id
    `, [organizationId, vendorIds]);
    const modifiers = await client.query('SELECT id, menu_item_id, name, required FROM menu_modifiers WHERE organization_id = $1 AND vendor_id = ANY($2::text[]) ORDER BY sort_order, id', [organizationId, vendorIds]);
    const options = await client.query('SELECT id, modifier_id, name, price_minor, capacity_units FROM menu_modifier_options WHERE organization_id = $1 AND modifier_id = ANY($2::text[]) ORDER BY sort_order, id', [organizationId, modifiers.rows.map((row) => row.id)]);
    const optionMap = new Map();
    for (const row of options.rows) {
      if (!optionMap.has(row.modifier_id)) optionMap.set(row.modifier_id, []);
      optionMap.get(row.modifier_id).push({ id: row.id, name: json(row.name), priceMinor: row.price_minor, capacityUnits: decimal(row.capacity_units) });
    }
    const modifierMap = new Map();
    for (const row of modifiers.rows) {
      if (!modifierMap.has(row.menu_item_id)) modifierMap.set(row.menu_item_id, []);
      modifierMap.get(row.menu_item_id).push({ id: row.id, name: json(row.name), required: row.required, options: optionMap.get(row.id) || [] });
    }
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    for (const row of items.rows) {
      vendorMap.get(row.vendor_id).menu.push({ id: row.id, category: json(row.category).en || json(row.category).th || '', name: json(row.name), description: json(row.description), priceMinor: row.price_minor, capacityUnits: decimal(row.capacity_units), emoji: row.emoji, image: row.image_url, available: row.available, modifiers: modifierMap.get(row.id) || [] });
    }
    const slots = await client.query('SELECT id, vendor_id, label, cutoff_at, starts_at, ends_at, max_orders, max_capacity_units, booked_orders, booked_capacity_units, closed FROM pickup_slots WHERE organization_id = $1 AND vendor_id = ANY($2::text[]) AND service_date = CURRENT_DATE ORDER BY vendor_id, starts_at', [organizationId, vendorIds]);
    for (const row of slots.rows) {
      vendorMap.get(row.vendor_id).slots.push({ id: row.id, vendorId: row.vendor_id, label: row.label, cutoff: row.cutoff_at ? new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }).format(new Date(row.cutoff_at)) : '', startsAt: row.starts_at, endsAt: row.ends_at, maxOrders: row.max_orders, maxCapacityUnits: decimal(row.max_capacity_units), bookedOrders: row.booked_orders, bookedCapacityUnits: decimal(row.booked_capacity_units), closed: row.closed });
    }
    for (const vendor of vendors) {
      const active = await client.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(capacity_units), 0) AS units FROM orders WHERE organization_id = $1 AND vendor_id = $2 AND status = ANY($3::text[])`, [organizationId, vendor.id, ACTIVE_STATUSES]);
      vendor.wait = calculateWaitEstimate({ ...vendor.settings, activeOrderWorkUnits: decimal(active.rows[0].units), incomingOrderWorkUnits: 0, nearTermReservedWorkUnits: 0, confidence: active.rows[0].count > 4 ? 'low' : 'medium' });
      vendor.wait.activeOrderCount = active.rows[0].count;
      vendor.wait.activeWorkUnits = decimal(active.rows[0].units);
    }
    return vendors;
  }

  async function loadOrders(client, user, vendorIds) {
    const conditions = ['o.organization_id = $1'];
    const params = [user.organizationId];
    if (user.role === 'STUDENT') {
      params.push(user.id);
      conditions.push(`o.owner_id = $${params.length}`);
    } else {
      params.push(vendorIds);
      conditions.push(`o.vendor_id = ANY($${params.length}::text[])`);
    }
    const ordersResult = await client.query(`SELECT o.*, ps.label AS slot_label FROM orders o LEFT JOIN pickup_slots ps ON ps.organization_id = o.organization_id AND ps.id = o.pickup_slot_id WHERE ${conditions.join(' AND ')} ORDER BY o.created_at DESC LIMIT 100`, params);
    if (!ordersResult.rows.length) return [];
    const ids = ordersResult.rows.map((row) => row.id);
    const itemResult = await client.query('SELECT * FROM order_items WHERE organization_id = $1 AND order_id = ANY($2::text[]) ORDER BY id', [user.organizationId, ids]);
    const eventResult = await client.query('SELECT order_id, from_status, to_status, created_at FROM order_status_events WHERE organization_id = $1 AND order_id = ANY($2::text[]) ORDER BY created_at', [user.organizationId, ids]);
    return ordersResult.rows.map((order) => publicOrder(order, itemResult.rows.filter((item) => item.order_id === order.id), eventResult.rows.filter((event) => event.order_id === order.id).map((event) => ({ status: event.to_status, at: event.created_at }))));
  }

  async function getOrder(client, organizationId, orderId) {
    const result = await client.query('SELECT o.*, ps.label AS slot_label FROM orders o LEFT JOIN pickup_slots ps ON ps.organization_id = o.organization_id AND ps.id = o.pickup_slot_id WHERE o.organization_id = $1 AND o.id = $2', [organizationId, orderId]);
    if (!result.rows[0]) return null;
    const items = await client.query('SELECT * FROM order_items WHERE organization_id = $1 AND order_id = $2 ORDER BY id', [organizationId, orderId]);
    const events = await client.query('SELECT to_status, created_at FROM order_status_events WHERE organization_id = $1 AND order_id = $2 ORDER BY created_at', [organizationId, orderId]);
    return publicOrder(result.rows[0], items.rows, events.rows.map((event) => ({ status: event.to_status, at: event.created_at })));
  }

  return {
    kind: 'postgres',
    pool,
    async ready() {
      if (autoMigrate) await migratePool(pool, migrationPath);
      await pool.query('SELECT 1');
    },
    async close() { await pool.end(); },

    async authenticate(email, password) {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT id, organization_id, email, password_hash, display_name, role FROM users WHERE lower(email) = $1', [normalizeEmail(email)]);
        const row = result.rows[0];
        if (!row || !verifyPassword(password, row.password_hash)) throw new DomainError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
        return rowUser(row, await vendorIdsFor(client, { id: row.id, organizationId: row.organization_id, role: row.role }));
      } finally {
        client.release();
      }
    },

    async createSession(userId) {
      const client = await pool.connect();
      try {
        const user = await userById(client, userId);
        if (!user) throw new DomainError('UNAUTHENTICATED', 'Session is no longer valid.', 401);
        const token = createSessionToken();
        const expiresAt = sessionExpiresAt();
        await client.query('INSERT INTO sessions (token_hash, user_id, organization_id, expires_at) VALUES ($1, $2, $3, $4)', [hashSessionToken(token), user.id, user.organizationId, expiresAt]);
        return { token, expiresAt };
      } finally {
        client.release();
      }
    },

    async getSession(token) {
      if (!token) return null;
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT u.id, u.organization_id, u.email, u.display_name, u.role FROM sessions s JOIN users u ON u.id = s.user_id AND u.organization_id = s.organization_id WHERE s.token_hash = $1 AND s.expires_at > now()', [hashSessionToken(token)]);
        return result.rows[0] ? rowUser(result.rows[0], await vendorIdsFor(client, { id: result.rows[0].id, organizationId: result.rows[0].organization_id, role: result.rows[0].role })) : null;
      } finally {
        client.release();
      }
    },

    async deleteSession(token) {
      if (!token) return;
      await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
    },

    async bootstrap(user) {
      const client = await pool.connect();
      try {
        const vendorIds = await vendorIdsFor(client, user);
        const [vendors, orders] = await Promise.all([loadCatalog(client, user.organizationId, user.role === 'STUDENT' ? null : vendorIds), loadOrders(client, user, vendorIds)]);
        const slotUsage = Object.fromEntries(vendors.flatMap((vendor) => vendor.slots.map((slot) => [`${vendor.id}:${slot.id}`, { bookedOrders: slot.bookedOrders, bookedCapacityUnits: slot.bookedCapacityUnits, maxOrders: slot.maxOrders, maxCapacityUnits: slot.maxCapacityUnits, closed: slot.closed }])));
        const campusResult = await client.query('SELECT id, name, city, time_zone, currency FROM campuses WHERE organization_id = $1 ORDER BY id LIMIT 1', [user.organizationId]);
        const campus = campusResult.rows[0] ? { id: campusResult.rows[0].id, name: json(campusResult.rows[0].name), city: campusResult.rows[0].city, timeZone: campusResult.rows[0].time_zone, currency: campusResult.rows[0].currency } : null;
        const metrics = vendorIds[0] ? await this.metrics(user, vendorIds[0]) : null;
        return { user, campus, vendors, orders, slotUsage, managedVendorIds: vendorIds, metrics };
      } finally {
        client.release();
      }
    },

    async createOrder(user, input) {
      const client = await pool.connect();
      const vendorId = String(input?.vendorId || '').trim();
      const orderType = input?.orderType === 'WALK_IN' ? 'WALK_IN' : 'PREORDER';
      const pickupSlotId = input?.pickupSlotId ? String(input.pickupSlotId) : null;
      const idempotencyKey = String(input?.idempotencyKey || '').trim();
      const requestFingerprint = createHash('sha256').update(JSON.stringify({ vendorId, pickupSlotId, orderType, items: input?.items || [], paymentMethod: input?.paymentMethod || 'PAY_AT_PICKUP' })).digest('hex');
      try {
        await client.query('BEGIN');
        if (idempotencyKey.length < 16 || idempotencyKey.length > 200) throw new DomainError('INVALID_IDEMPOTENCY_KEY', 'A valid idempotency key is required.', 422);
        const existing = await client.query('SELECT i.order_id, i.fingerprint FROM idempotency_keys i WHERE i.organization_id = $1 AND i.user_id = $2 AND i.key = $3 FOR UPDATE', [user.organizationId, user.id, idempotencyKey]);
        if (existing.rows[0]) {
          if (existing.rows[0].fingerprint !== requestFingerprint) throw new DomainError('IDEMPOTENCY_KEY_REUSE', 'That submission key was already used for another order.', 409);
          await client.query('COMMIT');
          const order = await getOrder(client, user.organizationId, existing.rows[0].order_id);
          return { order, replayed: true };
        }
        const vendorResult = await client.query('SELECT id, service_open, settings FROM vendors WHERE organization_id = $1 AND id = $2 FOR SHARE', [user.organizationId, vendorId]);
        const vendor = vendorResult.rows[0];
        if (!vendor) throw new DomainError('NOT_FOUND', 'Vendor not found.', 404);
        if (!vendor.service_open) throw new DomainError('VENDOR_PAUSED', 'This vendor is not accepting orders right now.', 409);
        if (!Array.isArray(input?.items) || !input.items.length) throw new DomainError('EMPTY_ORDER', 'Add at least one item before confirming.', 422);
        if (orderType === 'PREORDER' && !pickupSlotId) throw new DomainError('PICKUP_SLOT_REQUIRED', 'Choose a pickup time.', 422);
        const requestedIds = [...new Set(input.items.map((item) => String(item?.menuItemId || item?.itemId || '')))].filter(Boolean);
        const itemResult = await client.query('SELECT mi.id, mi.vendor_id, mi.name, mi.price_minor, mi.capacity_units, mi.available, mi.description, mi.emoji, mi.image_url, COALESCE(jsonb_agg(jsonb_build_object(\'id\', mm.id, \'name\', mm.name, \'required\', mm.required, \'options\', COALESCE((SELECT jsonb_agg(jsonb_build_object(\'id\', mo.id, \'name\', mo.name, \'priceMinor\', mo.price_minor, \'capacityUnits\', mo.capacity_units) ORDER BY mo.sort_order, mo.id) FROM menu_modifier_options mo WHERE mo.organization_id = mm.organization_id AND mo.modifier_id = mm.id), \'[]\'::jsonb)) ORDER BY mm.sort_order, mm.id) FILTER (WHERE mm.id IS NOT NULL), \'[]\'::jsonb) AS modifiers FROM menu_items mi LEFT JOIN menu_modifiers mm ON mm.organization_id = mi.organization_id AND mm.menu_item_id = mi.id WHERE mi.organization_id = $1 AND mi.vendor_id = $2 AND mi.id = ANY($3::text[]) GROUP BY mi.id', [user.organizationId, vendorId, requestedIds]);
        const itemMap = new Map(itemResult.rows.map((row) => [row.id, { id: row.id, name: json(row.name), description: json(row.description), priceMinor: row.price_minor, capacityUnits: decimal(row.capacity_units), available: row.available, modifiers: json(row.modifiers) }]));
        const normalizedLines = input.items.map((line) => {
          const item = itemMap.get(String(line?.menuItemId || line?.itemId || ''));
          if (!item) throw new DomainError('INVALID_MENU_ITEM', 'One of the menu items is no longer available.', 422);
          const quantity = Number(line.quantity);
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new DomainError('INVALID_QUANTITY', 'Quantity must be between 1 and 10.', 422);
          if (!item.available) throw new DomainError('SOLD_OUT', `${item.name.en || item.id} is sold out.`, 409);
          const modifiers = normalizeSelectedModifiers(item, line.modifiers || []);
          return { menuItemId: item.id, itemId: item.id, name: item.name, quantity, priceMinor: item.priceMinor + modifiers.reduce((sum, entry) => sum + entry.priceMinor, 0), capacityUnits: item.capacityUnits + modifiers.reduce((sum, entry) => sum + entry.capacityUnits, 0), modifiers };
        });
        const totals = calculateCartTotals(normalizedLines, 0.02);
        if (pickupSlotId) {
          const slotResult = await client.query('UPDATE pickup_slots SET booked_orders = booked_orders + 1, booked_capacity_units = booked_capacity_units + $4 WHERE organization_id = $1 AND vendor_id = $2 AND id = $3 AND closed = false AND booked_orders < max_orders AND booked_capacity_units + $4 <= max_capacity_units RETURNING id, label', [user.organizationId, vendorId, pickupSlotId, totals.capacityUnits]);
          if (!slotResult.rows[0]) throw new DomainError('CAPACITY_EXHAUSTED', 'That pickup slot is full. Choose another slot.', 409, { slotId: pickupSlotId });
        }
        const sequence = await client.query('INSERT INTO vendor_queue_sequences (organization_id, vendor_id, service_date, next_value) VALUES ($1, $2, CURRENT_DATE, 1) ON CONFLICT (organization_id, vendor_id, service_date) DO UPDATE SET next_value = vendor_queue_sequences.next_value + 1 RETURNING next_value', [user.organizationId, vendorId]);
        const queueValue = sequence.rows[0].next_value;
        const active = await client.query('SELECT COALESCE(SUM(capacity_units), 0) AS units FROM orders WHERE organization_id = $1 AND vendor_id = $2 AND status = ANY($3::text[])', [user.organizationId, vendorId, ACTIVE_STATUSES]);
        const settings = json(vendor.settings);
        const estimate = calculateWaitEstimate({ ...settings, activeOrderWorkUnits: decimal(active.rows[0].units) + totals.capacityUnits, now: new Date() });
        const orderId = `order-${randomUUID()}`;
        const now = new Date();
        await client.query('INSERT INTO orders (id, organization_id, vendor_id, owner_id, pickup_slot_id, order_ref, queue_number, order_type, status, subtotal_minor, service_fee_minor, total_minor, capacity_units, payment_method, payment_status, estimated_ready_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, \'PENDING\', $9, $10, $11, $12, $13, \'UNPAID\', $14, $15, $15)', [orderId, user.organizationId, vendorId, user.id, pickupSlotId, `JF-${String(queueValue + 4000).padStart(4, '0')}`, `A${String(queueValue).padStart(2, '0')}`, orderType, totals.subtotalMinor, totals.serviceFeeMinor, totals.totalMinor, totals.capacityUnits, input?.paymentMethod === 'MANUAL_CONFIRMED' ? 'MANUAL_CONFIRMED' : 'PAY_AT_PICKUP', estimate.estimatedReadyAt, now]);
        for (const line of totals.items) await client.query('INSERT INTO order_items (organization_id, order_id, vendor_id, menu_item_id, item_name, quantity, price_minor, capacity_units, modifiers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [user.organizationId, orderId, vendorId, line.menuItemId, JSON.stringify(line.name), line.quantity, line.priceMinor, line.capacityUnits, JSON.stringify(line.modifiers)]);
        await client.query('INSERT INTO order_status_events (organization_id, order_id, actor_id, to_status) VALUES ($1, $2, $3, \'PENDING\')', [user.organizationId, orderId, user.id]);
        await client.query('INSERT INTO payments (id, organization_id, order_id, method, status) VALUES ($1, $2, $3, $4, \'UNPAID\')', [`payment-${orderId}`, user.organizationId, orderId, input?.paymentMethod === 'MANUAL_CONFIRMED' ? 'MANUAL_CONFIRMED' : 'PAY_AT_PICKUP']);
        await client.query('INSERT INTO idempotency_keys (organization_id, user_id, key, fingerprint, order_id) VALUES ($1, $2, $3, $4, $5)', [user.organizationId, user.id, idempotencyKey, requestFingerprint, orderId]);
        await client.query('INSERT INTO audit_events (organization_id, actor_id, vendor_id, order_id, action, metadata) VALUES ($1, $2, $3, $4, \'ORDER_CREATED\', $5)', [user.organizationId, user.id, vendorId, orderId, JSON.stringify({ orderType })]);
        await client.query('COMMIT');
        const order = await getOrder(client, user.organizationId, orderId);
        return { order, replayed: false };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        if (error.code === '23505' && idempotencyKey) {
          const existing = await client.query('SELECT order_id FROM idempotency_keys WHERE organization_id = $1 AND user_id = $2 AND key = $3', [user.organizationId, user.id, idempotencyKey]);
          if (existing.rows[0]) return { order: await getOrder(client, user.organizationId, existing.rows[0].order_id), replayed: true };
        }
        throw error;
      } finally {
        client.release();
      }
    },

    async updateOrderStatus(user, orderId, nextStatus) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM orders WHERE organization_id = $1 AND id = $2 FOR UPDATE', [user.organizationId, orderId]);
        const order = result.rows[0];
        if (!order) throw new DomainError('NOT_FOUND', 'Order not found.', 404);
        if (!manageVendor(user, order.vendor_id)) throw new DomainError('FORBIDDEN', 'You cannot update this vendor order.', 403);
        if (!canTransitionOrderStatus(order.status, nextStatus)) throw new DomainError('INVALID_STATUS_TRANSITION', `Cannot move ${order.status} to ${nextStatus}.`, 409);
        const now = new Date();
        await client.query('UPDATE orders SET status = $3, confirmed_at = CASE WHEN $3 = \'CONFIRMED\' THEN $4 ELSE confirmed_at END, ready_at = CASE WHEN $3 = \'READY\' THEN $4 ELSE ready_at END, updated_at = $4 WHERE organization_id = $1 AND id = $2', [user.organizationId, orderId, nextStatus, now]);
        await client.query('INSERT INTO order_status_events (organization_id, order_id, actor_id, from_status, to_status) VALUES ($1, $2, $3, $4, $5)', [user.organizationId, orderId, user.id, order.status, nextStatus]);
        await client.query('INSERT INTO audit_events (organization_id, actor_id, vendor_id, order_id, action, metadata) VALUES ($1, $2, $3, $4, \'ORDER_STATUS_UPDATED\', $5)', [user.organizationId, user.id, order.vendor_id, orderId, JSON.stringify({ from: order.status, to: nextStatus })]);
        await client.query('COMMIT');
        return getOrder(client, user.organizationId, orderId);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async pickupOrder(user, orderId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM orders WHERE organization_id = $1 AND id = $2 AND owner_id = $3 FOR UPDATE', [user.organizationId, orderId, user.id]);
        const order = result.rows[0];
        if (!order) throw new DomainError('NOT_FOUND', 'Order not found.', 404);
        if (!canTransitionOrderStatus(order.status, 'COLLECTED')) throw new DomainError('INVALID_STATUS_TRANSITION', 'This order is not ready to be picked up.', 409);
        const now = new Date();
        await client.query('UPDATE orders SET status = \'COLLECTED\', collected_at = $3, updated_at = $3 WHERE organization_id = $1 AND id = $2', [user.organizationId, orderId, now]);
        await client.query('INSERT INTO order_status_events (organization_id, order_id, actor_id, from_status, to_status) VALUES ($1, $2, $3, $4, \'COLLECTED\')', [user.organizationId, orderId, user.id, order.status]);
        await client.query('INSERT INTO audit_events (organization_id, actor_id, vendor_id, order_id, action) VALUES ($1, $2, $3, $4, \'ORDER_COLLECTED\')', [user.organizationId, user.id, order.vendor_id, orderId]);
        await client.query('COMMIT');
        return getOrder(client, user.organizationId, orderId);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async setVendorPaused(user, vendorId, paused) {
      if (!manageVendor(user, vendorId)) throw new DomainError('FORBIDDEN', 'You cannot change this vendor.', 403);
      const result = await pool.query('UPDATE vendors SET service_open = $3 WHERE organization_id = $1 AND id = $2 RETURNING id, service_open', [user.organizationId, vendorId, !paused]);
      if (!result.rows[0]) throw new DomainError('NOT_FOUND', 'Vendor not found.', 404);
      await pool.query('INSERT INTO audit_events (organization_id, actor_id, vendor_id, action, metadata) VALUES ($1, $2, $3, \'VENDOR_SERVICE_TOGGLED\', $4)', [user.organizationId, user.id, vendorId, JSON.stringify({ paused: Boolean(paused) })]);
      return { vendorId, serviceOpen: result.rows[0].service_open };
    },

    async setMenuItemAvailability(user, itemId, available) {
      const result = await pool.query('SELECT vendor_id FROM menu_items WHERE organization_id = $1 AND id = $2', [user.organizationId, itemId]);
      if (!result.rows[0]) throw new DomainError('NOT_FOUND', 'Menu item not found.', 404);
      if (!manageVendor(user, result.rows[0].vendor_id)) throw new DomainError('FORBIDDEN', 'You cannot change this vendor menu.', 403);
      await pool.query('UPDATE menu_items SET available = $3 WHERE organization_id = $1 AND id = $2', [user.organizationId, itemId, Boolean(available)]);
      return { itemId, available: Boolean(available) };
    },

    async metrics(user, vendorId) {
      if (!manageVendor(user, vendorId)) throw new DomainError('FORBIDDEN', 'You cannot view this vendor metrics.', 403);
      const [active, completed, late, soldOut] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE organization_id = $1 AND vendor_id = $2 AND status = ANY($3::text[])', [user.organizationId, vendorId, ACTIVE_STATUSES]),
        pool.query('SELECT AVG(EXTRACT(EPOCH FROM (ready_at - confirmed_at)) / 60)::numeric AS average FROM orders WHERE organization_id = $1 AND vendor_id = $2 AND ready_at IS NOT NULL AND confirmed_at IS NOT NULL AND status IN (\'READY\', \'COLLECTED\')', [user.organizationId, vendorId]),
        pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE organization_id = $1 AND vendor_id = $2 AND ready_at > estimated_ready_at', [user.organizationId, vendorId]),
        pool.query('SELECT COUNT(*)::int AS count FROM menu_items WHERE organization_id = $1 AND vendor_id = $2 AND available = false', [user.organizationId, vendorId]),
      ]);
      const vendorSlots = await pool.query('SELECT id, label, booked_orders AS orders FROM pickup_slots WHERE organization_id = $1 AND vendor_id = $2 AND service_date = CURRENT_DATE ORDER BY starts_at', [user.organizationId, vendorId]);
      return { vendorId, ordersPerSlot: vendorSlots.rows.map((row) => ({ slotId: row.id, label: row.label, orders: row.orders })), averagePreparationMinutes: completed.rows[0].average ? Number(completed.rows[0].average) : null, lateOrders: late.rows[0].count, busiestTime: '11:35–11:45', soldOutItems: soldOut.rows[0].count, activeOrders: active.rows[0].count };
    },
  };
}
