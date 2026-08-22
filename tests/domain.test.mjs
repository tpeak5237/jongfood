import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateWaitEstimate,
  canTransitionOrderStatus,
  getPriorityScore,
  getSlotAvailability,
} from '../src/domain.mjs';

test('calculates money and capacity in one authoritative pass', () => {
  const result = calculateCartTotals([
    { priceMinor: 5500, quantity: 2, capacityUnits: 1 },
    { priceMinor: 1500, quantity: 1, capacityUnits: 0.1 },
  ], 0.05);
  assert.equal(result.subtotalMinor, 12500);
  assert.equal(result.serviceFeeMinor, 625);
  assert.equal(result.totalMinor, 13125);
  assert.equal(result.capacityUnits, 2.1);
});

test('marks slots nearly full without treating them as full', () => {
  const result = getSlotAvailability({ maxOrders: 10, bookedOrders: 8, maxCapacityUnits: 20, bookedCapacityUnits: 17 }, 1);
  assert.equal(result.available, true);
  assert.equal(result.nearlyFull, true);
  assert.equal(result.remainingOrders, 2);
});

test('rejects a slot when capacity units would be oversold', () => {
  const result = getSlotAvailability({ maxOrders: 10, bookedOrders: 4, maxCapacityUnits: 8, bookedCapacityUnits: 7.5 }, 1);
  assert.equal(result.available, false);
  assert.equal(result.full, true);
});

test('returns a rounded wait range with a deterministic source', () => {
  const result = calculateWaitEstimate({
    activeOrderWorkUnits: 14,
    incomingOrderWorkUnits: 3,
    baseCapacityPerMinute: 1.7,
    bufferMinutes: 2,
    roundingMinutes: 5,
    now: new Date('2026-08-03T05:00:00.000Z'),
  });
  assert.equal(result.lowerBoundMinutes % 5, 0);
  assert.equal(result.upperBoundMinutes % 5, 0);
  assert.equal(result.source, 'deterministic-capacity-v1');
  assert.equal(result.estimatedReadyAt.toISOString(), '2026-08-03T05:15:00.000Z');
});

test('allows only the configured order transitions', () => {
  assert.equal(canTransitionOrderStatus('CONFIRMED', 'PREPARING'), true);
  assert.equal(canTransitionOrderStatus('CONFIRMED', 'READY'), false);
  assert.equal(canTransitionOrderStatus('READY', 'COLLECTED'), true);
});

test('priority is deterministic and keeps walk-ins from auto-jumping pre-orders', () => {
  const preorder = getPriorityScore({
    committedReadyAt: '2026-08-03T05:10:00.000Z',
    confirmedAt: '2026-08-03T05:00:00.000Z',
    orderType: 'PREORDER',
  });
  const walkIn = getPriorityScore({
    committedReadyAt: '2026-08-03T05:10:00.000Z',
    confirmedAt: '2026-08-03T05:00:00.000Z',
    orderType: 'WALK_IN',
  });
  assert.ok(preorder.score > walkIn.score);
  assert.deepEqual(preorder.factors.slice(0, 3), ['committed_ready_time', 'confirmed_time', 'order_type']);
});
