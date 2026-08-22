# Order engine

## State machine

```text
PENDING → CONFIRMED → PREPARING → READY → COLLECTED
   ├──────────────→ REJECTED
   └──────────────→ CANCELLED
CONFIRMED → CANCELLED
PREPARING → CANCELLED
READY → NO_SHOW
```

The transition table in `src/domain.mjs` is reused by both adapters. A status endpoint accepts the requested next status, checks tenant and vendor assignment, validates the edge, updates the order, and appends an immutable status event and audit event.

## Create-order contract

`POST /api/orders` requires an `Idempotency-Key` header of at least 16 characters and a body containing `vendorId`, `orderType`, `items`, and `pickupSlotId` for pre-orders. The server re-reads the menu item, availability, modifier options, price, capacity units, and vendor state. Client-supplied price or capacity values are ignored.

The transaction creates the order, snapshots item/modifier data into order items, records the initial status event, creates a payment abstraction, records the idempotency key, and updates slot capacity atomically. A repeated request with the same key and fingerprint returns the original order; the same key with a different payload is rejected.

## Payment boundary

`PAY_AT_PICKUP` and `MANUAL_CONFIRMED` are supported as states, not proof of money movement. Provider webhooks and reconciliation are intentionally deferred. No card details are accepted or stored.

## Notifications and audit

Order status changes are audit-worthy and modelled for notifications. The current MVP stores audit events in PostgreSQL/memory but does not claim external push, LINE, email, or SMS delivery.
