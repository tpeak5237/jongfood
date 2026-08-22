import { createHash } from 'node:crypto';
import {
  calculateCartTotals,
  calculateWaitEstimate,
  canTransitionOrderStatus,
} from '../domain.mjs';
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  publicUser,
  sessionExpiresAt,
  verifyPassword,
} from './auth.mjs';
import { createSeedData } from './seed.mjs';

export class DomainError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const ACTIVE_STATUSES = new Set(['PENDING', 'CONFIRMED', 'PREPARING']);
const PUBLIC_ORDER_FIELDS = [
  'id', 'organizationId', 'vendorId', 'shopId', 'ownerId', 'ref', 'queueNumber', 'orderType', 'status', 'items',
  'subtotalMinor', 'serviceFeeMinor', 'totalMinor', 'capacityUnits', 'slotId', 'slotLabel', 'paymentMethod',
  'paymentStatus', 'createdAt', 'confirmedAt', 'estimatedReadyAt', 'readyAt', 'collectedAt', 'updatedAt', 'statusHistory',
];

const clone = (value) => structuredClone(value);
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function copyUserForStore(user) {
  return { ...user, passwordHash: hashPassword(user.password) };
}

function publicOrder(order) {
  return Object.fromEntries(PUBLIC_ORDER_FIELDS.filter((field) => order[field] !== undefined).map((field) => [field, clone(order[field])]));
}

export function normalizeSelectedModifiers(item, selections = []) {
  if (!Array.isArray(selections)) throw new DomainError('INVALID_MODIFIERS', 'Modifiers must be an array.', 422);
  const byModifier = new Map();
  for (const selection of selections) {
    const modifierId = String(selection?.modifierId || '').trim();
    const optionId = String(selection?.optionId || '').trim();
    if (!modifierId || !optionId || byModifier.has(modifierId)) throw new DomainError('INVALID_MODIFIERS', 'Each modifier can be selected once.', 422);
    byModifier.set(modifierId, optionId);
  }
  const normalized = [];
  for (const modifier of item.modifiers || []) {
    const optionId = byModifier.get(modifier.id);
    if (modifier.required && !optionId) {
      throw new DomainError('REQUIRED_MODIFIER', `Choose ${modifier.name.en || 'a required option'}.`, 422, { modifierId: modifier.id });
    }
    if (!optionId) continue;
    const selectedOption = modifier.options.find((option) => option.id === optionId);
    if (!selectedOption) throw new DomainError('INVALID_MODIFIER_OPTION', 'That modifier option is not available.', 422, { modifierId: modifier.id, optionId });
    normalized.push({
      modifierId: modifier.id,
      modifierName: clone(modifier.name),
      optionId: selectedOption.id,
      optionName: clone(selectedOption.name),
      priceMinor: Number(selectedOption.priceMinor || 0),
      capacityUnits: Number(selectedOption.capacityUnits || 0),
    });
  }
  const knownModifierIds = new Set((item.modifiers || []).map((modifier) => modifier.id));
  if ([...byModifier.keys()].some((modifierId) => !knownModifierIds.has(modifierId))) throw new DomainError('INVALID_MODIFIERS', 'That modifier is not available for this item.', 422);
  return normalized;
}

function itemForVendor(vendor, itemId) {
  return vendor?.menu.find((item) => item.id === itemId) || null;
}

function calculateVendorWait(data, vendorId, now = new Date()) {
  const vendor = data.vendors.find((candidate) => candidate.id === vendorId);
  if (!vendor) return calculateWaitEstimate({ now });
  const activeOrders = data.orders.filter((order) => order.vendorId === vendorId && ACTIVE_STATUSES.has(order.status));
  const activeUnits = activeOrders.reduce((sum, order) => sum + Number(order.capacityUnits || 0), 0);
  const estimate = calculateWaitEstimate({
    ...vendor.settings,
    activeOrderWorkUnits: activeUnits,
    incomingOrderWorkUnits: 0,
    nearTermReservedWorkUnits: 0,
    confidence: activeOrders.length > 4 ? 'low' : 'medium',
    now,
  });
  return { ...estimate, activeOrderCount: activeOrders.length, activeWorkUnits: activeUnits };
}

function vendorSnapshot(data, vendor, now) {
  const wait = calculateVendorWait(data, vendor.id, now);
  return {
    ...clone(vendor),
    wait,
    slots: data.slots.filter((slot) => slot.vendorId === vendor.id).map(clone),
  };
}

function slotUsage(data) {
  return Object.fromEntries(data.slots.map((slot) => [`${slot.vendorId}:${slot.id}`, {
    bookedOrders: slot.bookedOrders,
    bookedCapacityUnits: slot.bookedCapacityUnits,
    maxOrders: slot.maxOrders,
    maxCapacityUnits: slot.maxCapacityUnits,
    closed: slot.closed,
  }]));
}

function assertUser(user) {
  if (!user) throw new DomainError('UNAUTHENTICATED', 'Sign in to continue.', 401);
}

export function createMemoryStore(seed = createSeedData()) {
  const data = {
    ...seed,
    users: seed.users.map(copyUserForStore),
    vendors: clone(seed.vendors),
    slots: clone(seed.slots),
    orders: clone(seed.orders),
    sessions: new Map(),
    idempotency: new Map(),
    auditEvents: [],
    nextQueueNumber: new Map(seed.nextQueueNumber),
  };

  const findUserById = (id) => data.users.find((user) => user.id === id) || null;
  const findVendor = (id) => data.vendors.find((vendor) => vendor.id === id) || null;
  const findOrder = (id) => data.orders.find((order) => order.id === id) || null;
  const isStaffForVendor = (user, vendorId) => ['VENDOR_STAFF', 'MANAGER', 'ORG_ADMIN'].includes(user.role)
    && (['MANAGER', 'ORG_ADMIN'].includes(user.role) || user.vendorIds?.includes(vendorId));

  return {
    kind: 'memory',
    async ready() {},
    async close() {},

    async authenticate(email, password) {
      const user = data.users.find((candidate) => candidate.email === normalizeEmail(email));
      if (!user || !verifyPassword(password, user.passwordHash)) throw new DomainError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
      return publicUser(user);
    },

    async createSession(userId) {
      const token = createSessionToken();
      data.sessions.set(hashSessionToken(token), { userId, expiresAt: sessionExpiresAt() });
      return { token, expiresAt: data.sessions.get(hashSessionToken(token)).expiresAt };
    },

    async getSession(token) {
      if (!token) return null;
      const key = hashSessionToken(token);
      const session = data.sessions.get(key);
      if (!session || session.expiresAt <= new Date()) {
        data.sessions.delete(key);
        return null;
      }
      const user = findUserById(session.userId);
      return user ? publicUser(user) : null;
    },

    async deleteSession(token) {
      if (token) data.sessions.delete(hashSessionToken(token));
    },

    async bootstrap(user) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      if (!currentUser) throw new DomainError('UNAUTHENTICATED', 'Session is no longer valid.', 401);
      const managedVendorIds = currentUser.vendorIds || [];
      const visibleOrders = currentUser.role === 'STUDENT'
        ? data.orders.filter((order) => order.ownerId === currentUser.id)
        : data.orders.filter((order) => managedVendorIds.includes(order.vendorId));
      const visibleVendors = currentUser.role === 'STUDENT'
        ? data.vendors
        : data.vendors.filter((vendor) => managedVendorIds.includes(vendor.id));
      const now = new Date();
      return {
        user: publicUser(currentUser),
        campus: clone(data.campus),
        vendors: visibleVendors.map((vendor) => vendorSnapshot(data, vendor, now)),
        orders: visibleOrders.map(publicOrder),
        slotUsage: slotUsage(data),
        managedVendorIds: [...managedVendorIds],
        metrics: managedVendorIds.length ? this.metrics({ ...currentUser }, managedVendorIds[0]) : null,
      };
    },

    async createOrder(user, input) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      if (!currentUser) throw new DomainError('UNAUTHENTICATED', 'Session is no longer valid.', 401);
      const vendorId = String(input?.vendorId || '').trim();
      const vendor = findVendor(vendorId);
      if (!vendor || vendor.organizationId !== currentUser.organizationId) throw new DomainError('NOT_FOUND', 'Vendor not found.', 404);
      if (!vendor.serviceOpen) throw new DomainError('VENDOR_PAUSED', 'This vendor is not accepting orders right now.', 409);
      const orderType = input?.orderType === 'WALK_IN' ? 'WALK_IN' : 'PREORDER';
      const pickupSlotId = input?.pickupSlotId ? String(input.pickupSlotId) : null;
      const idempotencyKey = String(input?.idempotencyKey || '').trim();
      if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 200) throw new DomainError('INVALID_IDEMPOTENCY_KEY', 'A valid idempotency key is required.', 422);
      const requestedItems = Array.isArray(input?.items) ? input.items : [];
      if (!requestedItems.length) throw new DomainError('EMPTY_ORDER', 'Add at least one item before confirming.', 422);
      const requestFingerprint = fingerprint({ vendorId, pickupSlotId, orderType, items: requestedItems, paymentMethod: input?.paymentMethod || 'PAY_AT_PICKUP' });
      const replayKey = `${currentUser.id}:${idempotencyKey}`;
      const previous = data.idempotency.get(replayKey);
      if (previous) {
        if (previous.fingerprint !== requestFingerprint) throw new DomainError('IDEMPOTENCY_KEY_REUSE', 'That submission key was already used for another order.', 409);
        return { order: publicOrder(findOrder(previous.orderId)), replayed: true };
      }
      if (orderType === 'PREORDER' && !pickupSlotId) throw new DomainError('PICKUP_SLOT_REQUIRED', 'Choose a pickup time.', 422);
      const slot = pickupSlotId ? data.slots.find((candidate) => candidate.id === pickupSlotId && candidate.vendorId === vendor.id) : null;
      if (orderType === 'PREORDER' && !slot) throw new DomainError('INVALID_PICKUP_SLOT', 'That pickup slot is not available for this vendor.', 422);
      if (slot?.closed) throw new DomainError('CAPACITY_EXHAUSTED', 'That pickup slot is closed. Choose another slot.', 409);

      const normalizedLines = requestedItems.map((line) => {
        const item = itemForVendor(vendor, String(line?.menuItemId || line?.itemId || ''));
        if (!item) throw new DomainError('INVALID_MENU_ITEM', 'One of the menu items is no longer available.', 422);
        const quantity = Number(line.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new DomainError('INVALID_QUANTITY', 'Quantity must be between 1 and 10.', 422);
        if (!item.available) throw new DomainError('SOLD_OUT', `${item.name.en} is sold out.`, 409, { menuItemId: item.id });
        const selectedModifiers = normalizeSelectedModifiers(item, line.modifiers || []);
        const modifierPriceMinor = selectedModifiers.reduce((sum, entry) => sum + entry.priceMinor, 0);
        const modifierCapacityUnits = selectedModifiers.reduce((sum, entry) => sum + entry.capacityUnits, 0);
        return {
          menuItemId: item.id,
          itemId: item.id,
          name: clone(item.name),
          quantity,
          priceMinor: item.priceMinor + modifierPriceMinor,
          capacityUnits: item.capacityUnits + modifierCapacityUnits,
          modifiers: selectedModifiers,
        };
      });
      const totals = calculateCartTotals(normalizedLines, 0.02);
      if (slot) {
        const remainingOrders = slot.maxOrders - slot.bookedOrders;
        const remainingCapacityUnits = slot.maxCapacityUnits - slot.bookedCapacityUnits;
        if (remainingOrders < 1 || remainingCapacityUnits < totals.capacityUnits) throw new DomainError('CAPACITY_EXHAUSTED', 'That pickup slot is full. Choose another slot.', 409, { slotId: slot.id, remainingOrders: Math.max(0, remainingOrders), remainingCapacityUnits: Math.max(0, remainingCapacityUnits) });
        slot.bookedOrders += 1;
        slot.bookedCapacityUnits += totals.capacityUnits;
      }
      const now = new Date();
      const nextNumber = (data.nextQueueNumber.get(vendor.id) || 1) + 1;
      data.nextQueueNumber.set(vendor.id, nextNumber);
      const queueNumber = `A${String(nextNumber).padStart(2, '0')}`;
      const estimate = calculateVendorWait(data, vendor.id, now);
      const order = {
        id: `order-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        organizationId: currentUser.organizationId,
        vendorId: vendor.id,
        shopId: vendor.id,
        ownerId: currentUser.id,
        ref: `JF-${String(nextNumber + 4000).padStart(4, '0')}`,
        queueNumber,
        orderType,
        status: 'PENDING',
        items: totals.items,
        subtotalMinor: totals.subtotalMinor,
        serviceFeeMinor: totals.serviceFeeMinor,
        totalMinor: totals.totalMinor,
        capacityUnits: totals.capacityUnits,
        slotId: slot?.id || null,
        slotLabel: slot?.label || null,
        paymentMethod: input?.paymentMethod === 'MANUAL_CONFIRMED' ? 'MANUAL_CONFIRMED' : 'PAY_AT_PICKUP',
        paymentStatus: 'UNPAID',
        createdAt: now.toISOString(),
        confirmedAt: null,
        estimatedReadyAt: estimate.estimatedReadyAt.toISOString(),
        statusHistory: [{ status: 'PENDING', at: now.toISOString() }],
      };
      data.orders.unshift(order);
      data.idempotency.set(replayKey, { fingerprint: requestFingerprint, orderId: order.id });
      data.auditEvents.push({ action: 'ORDER_CREATED', actorId: currentUser.id, organizationId: currentUser.organizationId, vendorId: vendor.id, orderId: order.id, at: now.toISOString() });
      return { order: publicOrder(order), replayed: false };
    },

    async updateOrderStatus(user, orderId, nextStatus) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      const order = findOrder(orderId);
      if (!order || order.organizationId !== currentUser?.organizationId) throw new DomainError('NOT_FOUND', 'Order not found.', 404);
      if (!currentUser || !isStaffForVendor(currentUser, order.vendorId)) throw new DomainError('FORBIDDEN', 'You cannot update this vendor order.', 403);
      if (!canTransitionOrderStatus(order.status, nextStatus)) throw new DomainError('INVALID_STATUS_TRANSITION', `Cannot move ${order.status} to ${nextStatus}.`, 409);
      const now = new Date().toISOString();
      order.status = nextStatus;
      order.updatedAt = now;
      order.statusHistory.push({ status: nextStatus, at: now });
      if (nextStatus === 'CONFIRMED') order.confirmedAt = now;
      if (nextStatus === 'READY') order.readyAt = now;
      data.auditEvents.push({ action: 'ORDER_STATUS_UPDATED', actorId: currentUser.id, organizationId: currentUser.organizationId, vendorId: order.vendorId, orderId, status: nextStatus, at: now });
      return publicOrder(order);
    },

    async pickupOrder(user, orderId) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      const order = findOrder(orderId);
      if (!order || order.organizationId !== currentUser?.organizationId || order.ownerId !== currentUser?.id) throw new DomainError('NOT_FOUND', 'Order not found.', 404);
      if (!canTransitionOrderStatus(order.status, 'COLLECTED')) throw new DomainError('INVALID_STATUS_TRANSITION', 'This order is not ready to be picked up.', 409);
      const now = new Date().toISOString();
      order.status = 'COLLECTED';
      order.collectedAt = now;
      order.updatedAt = now;
      order.statusHistory.push({ status: 'COLLECTED', at: now });
      data.auditEvents.push({ action: 'ORDER_COLLECTED', actorId: currentUser.id, organizationId: currentUser.organizationId, vendorId: order.vendorId, orderId, at: now });
      return publicOrder(order);
    },

    async setVendorPaused(user, vendorId, paused) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      const vendor = findVendor(vendorId);
      if (!vendor || vendor.organizationId !== currentUser?.organizationId) throw new DomainError('NOT_FOUND', 'Vendor not found.', 404);
      if (!currentUser || !isStaffForVendor(currentUser, vendorId)) throw new DomainError('FORBIDDEN', 'You cannot change this vendor.', 403);
      vendor.serviceOpen = !paused;
      data.auditEvents.push({ action: 'VENDOR_SERVICE_TOGGLED', actorId: currentUser.id, organizationId: currentUser.organizationId, vendorId, paused: Boolean(paused), at: new Date().toISOString() });
      return { vendorId, serviceOpen: vendor.serviceOpen };
    },

    async setMenuItemAvailability(user, itemId, available) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      const vendor = data.vendors.find((candidate) => candidate.menu.some((item) => item.id === itemId));
      const item = vendor ? itemForVendor(vendor, itemId) : null;
      if (!vendor || !item || vendor.organizationId !== currentUser?.organizationId) throw new DomainError('NOT_FOUND', 'Menu item not found.', 404);
      if (!currentUser || !isStaffForVendor(currentUser, vendor.id)) throw new DomainError('FORBIDDEN', 'You cannot change this vendor menu.', 403);
      item.available = Boolean(available);
      data.auditEvents.push({ action: 'MENU_ITEM_AVAILABILITY_UPDATED', actorId: currentUser.id, organizationId: currentUser.organizationId, vendorId: vendor.id, itemId, available: item.available, at: new Date().toISOString() });
      return { itemId, available: item.available };
    },

    async metrics(user, vendorId) {
      assertUser(user);
      const currentUser = findUserById(user.id);
      if (!currentUser || !isStaffForVendor(currentUser, vendorId)) throw new DomainError('FORBIDDEN', 'You cannot view this vendor metrics.', 403);
      const vendorOrders = data.orders.filter((order) => order.vendorId === vendorId);
      const activeOrders = vendorOrders.filter((order) => ACTIVE_STATUSES.has(order.status));
      const collected = vendorOrders.filter((order) => order.status === 'COLLECTED');
      const prepTimes = collected.filter((order) => order.confirmedAt && order.readyAt).map((order) => (new Date(order.readyAt).getTime() - new Date(order.confirmedAt).getTime()) / 60_000);
      const avgPreparationMinutes = prepTimes.length ? Math.round((prepTimes.reduce((sum, value) => sum + value, 0) / prepTimes.length) * 10) / 10 : null;
      const lateOrders = vendorOrders.filter((order) => order.readyAt && order.estimatedReadyAt && new Date(order.readyAt) > new Date(order.estimatedReadyAt)).length;
      const soldOutItems = findVendor(vendorId)?.menu.filter((item) => !item.available).length || 0;
      const wait = calculateVendorWait(data, vendorId);
      return { vendorId, ordersPerSlot: data.slots.filter((slot) => slot.vendorId === vendorId).map((slot) => ({ slotId: slot.id, label: slot.label, orders: slot.bookedOrders })), averagePreparationMinutes: avgPreparationMinutes, lateOrders, busiestTime: '11:35–11:45', soldOutItems, activeOrders: activeOrders.length, wait };
    },

    inspect() {
      return clone({ ...data, sessions: undefined, idempotency: undefined });
    },
  };
}
