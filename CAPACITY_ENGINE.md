# Capacity and ETA engine

## Pickup slot capacity

Each `PickupSlot` has `max_orders`, `max_capacity_units`, `booked_orders`, and `booked_capacity_units`. A cart consumes both order count and preparation capacity units. A slot is available only when both limits remain and the slot is not closed.

In PostgreSQL, order creation performs one conditional update inside a transaction:

```sql
UPDATE pickup_slots
SET booked_orders = booked_orders + 1,
    booked_capacity_units = booked_capacity_units + :cart_units
WHERE id = :slot_id
  AND booked_orders < max_orders
  AND booked_capacity_units + :cart_units <= max_capacity_units
RETURNING id;
```

If no row returns, the server responds with `CAPACITY_EXHAUSTED`. This is the concurrency boundary for the final slot; the browser availability display is only an early hint.

## Wait estimate

The deterministic estimate uses active work and recent configured throughput:

```text
effective capacity = base capacity per minute × active multiplier
raw minutes = (active + incoming + near-term reserved units) / effective capacity
              + buffer minutes + manual delay
displayed range = round(raw × lower multiplier) … round(raw × upper multiplier)
```

The result includes lower/upper minutes, an estimated timestamp, confidence, source, calculation version, and calculation time. Customer copy says “approximately” and “a range, never a promise.”

## Walk-ins

Walk-ins enter the same queue data model as pre-orders. Priority uses committed ready time, confirmation time, order type, and an optional audited manual override. A walk-in does not automatically jump a scheduled pickup order.
