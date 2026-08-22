# JongFood MVP scope

> This scope now describes the server-backed MVP. The root [PRODUCT.md](../../PRODUCT.md) is the concise product contract.

## Included in this walkthrough

- Bilingual Thai / English customer ordering surface.
- Three sample canteen shops with menu availability and item-level preparation load.
- Pre-order cart, subtotal, service fee, capacity-aware pickup windows, and confirmation.
- Walk-in order creation using the same queue data model.
- Customer order tracking with queue number, status, slot, and estimated ready time.
- Merchant queue board with new, preparing, and ready columns.
- Merchant status advancement with guarded order transitions.
- Menu availability management.
- Wait-time and service pause controls.
- Large-screen estimated-wait workspace with a compact Config button into the MVP controls.
- Server-backed session, order, capacity, status, and audit persistence; the local memory adapter is test-only.

## Deferred after the production-oriented MVP

- Organization and canteen administration screens.
- Real notifications, payments, reports, and audit storage.
- External notification delivery, payment provider callbacks, load tests, and provider tests.

The production completion definition is recorded in the master brief and [LIVE_PROOF.md](../../LIVE_PROOF.md); this file distinguishes implemented MVP behavior from secondary scope.
