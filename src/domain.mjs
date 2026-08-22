export const ORDER_STATUSES = Object.freeze([
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COLLECTED',
  'CANCELLED',
  'REJECTED',
  'NO_SHOW',
]);

const transitions = Object.freeze({
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COLLECTED', 'NO_SHOW'],
  COLLECTED: [],
  CANCELLED: [],
  REJECTED: [],
  NO_SHOW: [],
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function calculateCartTotals(items, serviceFeeRate = 0) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');

  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const priceMinor = Number(item.priceMinor);
    const capacityUnits = Number(item.capacityUnits ?? 0);
    if (!Number.isInteger(quantity) || quantity < 1) throw new RangeError('quantity must be a positive integer');
    if (!Number.isInteger(priceMinor) || priceMinor < 0) throw new RangeError('priceMinor must be a non-negative integer');
    if (!Number.isFinite(capacityUnits) || capacityUnits < 0) throw new RangeError('capacityUnits must be non-negative');
    return {
      ...item,
      quantity,
      priceMinor,
      capacityUnits,
      lineTotalMinor: priceMinor * quantity,
      lineCapacityUnits: capacityUnits * quantity,
    };
  });

  const subtotalMinor = normalizedItems.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const serviceFeeMinor = Math.round(subtotalMinor * serviceFeeRate);
  return {
    items: normalizedItems,
    subtotalMinor,
    serviceFeeMinor,
    totalMinor: subtotalMinor + serviceFeeMinor,
    capacityUnits: normalizedItems.reduce((sum, item) => sum + item.lineCapacityUnits, 0),
  };
}

export function calculateWaitEstimate({
  activeOrderWorkUnits = 0,
  incomingOrderWorkUnits = 0,
  nearTermReservedWorkUnits = 0,
  baseCapacityPerMinute = 1.8,
  activeCapacityMultiplier = 1,
  bufferMinutes = 3,
  lowerMultiplier = 0.8,
  upperMultiplier = 1.2,
  minimumWaitMinutes = 5,
  maximumWaitMinutes = 60,
  roundingMinutes = 5,
  manualDelayMinutes = 0,
  confidence = 'medium',
  now = new Date(),
}) {
  const workUnits = Math.max(0, Number(activeOrderWorkUnits) + Number(incomingOrderWorkUnits) + Number(nearTermReservedWorkUnits));
  const capacity = Math.max(0.1, Number(baseCapacityPerMinute) * Number(activeCapacityMultiplier));
  const rawMinutes = workUnits / capacity + Math.max(0, Number(bufferMinutes)) + Number(manualDelayMinutes);
  const midpoint = clamp(rawMinutes, Number(minimumWaitMinutes), Number(maximumWaitMinutes));
  const roundUp = (minutes) => Math.ceil(minutes / Math.max(1, Number(roundingMinutes))) * Math.max(1, Number(roundingMinutes));
  const lowerBoundMinutes = clamp(roundUp(midpoint * Number(lowerMultiplier)), Number(minimumWaitMinutes), Number(maximumWaitMinutes));
  const upperBoundMinutes = clamp(
    Math.max(lowerBoundMinutes, roundUp(midpoint * Number(upperMultiplier))),
    lowerBoundMinutes,
    Number(maximumWaitMinutes),
  );

  return {
    lowerBoundMinutes,
    upperBoundMinutes,
    estimatedReadyAt: new Date(now.getTime() + upperBoundMinutes * 60_000),
    confidence,
    source: 'deterministic-capacity-v1',
    calculationVersion: 1,
    calculatedAt: now,
  };
}

export function getSlotAvailability(slot, cartCapacityUnits = 0) {
  const remainingOrders = Math.max(0, Number(slot.maxOrders) - Number(slot.bookedOrders));
  const remainingCapacityUnits = Math.max(0, Number(slot.maxCapacityUnits) - Number(slot.bookedCapacityUnits));
  const hasCapacity = remainingOrders > 0 && remainingCapacityUnits >= Number(cartCapacityUnits);
  const nearlyFull = hasCapacity && (remainingOrders <= 2 || remainingCapacityUnits <= Math.max(1, Number(slot.maxCapacityUnits) * 0.2));
  return {
    remainingOrders,
    remainingCapacityUnits,
    available: hasCapacity && !slot.closed,
    nearlyFull,
    full: !hasCapacity || slot.closed,
  };
}

export function canTransitionOrderStatus(from, to) {
  return Boolean(transitions[from]?.includes(to));
}

export function getNextOrderStatus(status) {
  return transitions[status]?.[0] || null;
}

export function getPriorityScore({ committedReadyAt, confirmedAt, orderType = 'PREORDER', manualOverride = 0 }) {
  const readyScore = committedReadyAt ? Math.max(0, 10_000 - Math.floor(new Date(committedReadyAt).getTime() / 60_000)) : 0;
  const confirmedScore = confirmedAt ? Math.max(0, 2_000 - Math.floor(new Date(confirmedAt).getTime() / 60_000)) : 0;
  const typeScore = orderType === 'WALK_IN' ? 0 : 100;
  return {
    score: readyScore + confirmedScore + typeScore + Number(manualOverride || 0),
    factors: ['committed_ready_time', 'confirmed_time', 'order_type', ...(manualOverride ? ['manual_override'] : [])],
    calculationVersion: 1,
  };
}

export function formatCurrency(minorUnits, currency = 'THB', locale = 'th-TH') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(minorUnits / 100);
}
