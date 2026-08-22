# JongFood architecture

## Runtime layers

```text
Browser UI (app.js + styles.css)
        │ same-origin JSON API + HttpOnly session cookie
HTTP application (src/server/http-app.mjs)
        │ store interface
PostgresStore (production) or MemoryStore (local/test only)
        │
PostgreSQL migration (db/migrations/001_initial.sql)
```

The browser owns view state and an in-progress cart only. Identity, menu availability, authoritative price, pickup capacity, order status, audit events, and payment status are server-owned. Reload calls `/api/bootstrap`; it does not restore orders from localStorage.

## Entities

The migration includes Organization, Campus, Vendor, VendorStaff, Menu, MenuCategory, MenuItem, MenuModifier, AvailabilityWindow, PickupSlot, User, Session, Order, OrderItem, OrderStatusEvent, Payment, Notification, AuditEvent, IdempotencyKey, and VendorQueueSequence.

Every tenant-owned table carries `organization_id`. Composite foreign keys keep vendor, user, menu, slot, and order relationships in the same organization. Indexes cover vendor queue reads, student order history, slot lookup, status events, sessions, and audit chronology.

## API surface

| Method | Route | Authorization |
| --- | --- | --- |
| GET | `/api/session` | Public session check |
| POST | `/api/auth/login` | Public credentials check |
| POST | `/api/auth/logout` | Current session |
| GET | `/api/bootstrap` | Authenticated; role-scoped payload |
| POST | `/api/orders` | Authenticated; idempotency required |
| PATCH | `/api/orders/:id/status` | Assigned vendor staff/manager |
| POST | `/api/orders/:id/pickup` | Order owner only |
| POST | `/api/vendors/:id/pause` | Assigned vendor staff/manager |
| PATCH | `/api/menu-items/:id/availability` | Assigned vendor staff/manager |

Errors are JSON objects with stable `error.code`, human-readable `message`, and optional details. The browser must treat client-side checks as hints and display server conflicts without dropping the cart.

## Deployment boundary

`JONGFOOD_STORE=memory` is allowed only outside production. `NODE_ENV=production` requires `DATABASE_URL`. PostgreSQL migrations and demo seeding are explicit commands; the application does not silently create a production schema or invent payment success.
