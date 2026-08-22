# JongFood affinity map

This synthesis uses the product brief as the only source of qualitative signal. It is not a substitute for interviews or usability research; observations are tagged `B1` to make that limitation explicit.

## Raw observations

- `B1` Lunch-hour congestion is the central problem to reduce.
- `B1` Customers need to compare shops, availability, pickup windows, queue numbers, and estimated wait before ordering.
- `B1` A walk-in customer should still enter the same operational queue as a pre-order.
- `B1` Merchants need fast tablet-friendly status actions while orders move through a live preparation queue.
- `B1` Preparation load differs by item, so order count alone cannot describe capacity.
- `B1` Wait estimates must be ranges, configurable, and visibly non-guaranteed.
- `B1` Organizations need different service periods, slot rules, branding, languages, currencies, and time zones.
- `B1` Status changes, manual priority, and sensitive actions need history and auditability.

## Bottom-up clusters

### 1. “Decide before the rush”

Evidence: `B1` browse participating shops; `B1` view availability; `B1` compare pickup time and estimated readiness.

Insight: Customers need a fast decision surface, not a marketplace maze. The first screen should answer “what is open, what can I get, and when can I collect it?”

### 2. “A promise with useful uncertainty”

Evidence: `B1` configurable estimated wait; `B1` ranges instead of exact minutes; `B1` show cutoff, remaining capacity, and readiness.

Insight: Trust comes from showing the source of uncertainty. A practical range and a committed collection window are more useful than false precision.

### 3. “One queue, two entry points”

Evidence: `B1` pre-orders and walk-ins share the preparation queue; `B1` walk-ins are ordered by predicted ready time; `B1` staff need a live board.

Insight: The customer experience and kitchen experience must share one operational truth. Separate flows may enter the system, but they cannot diverge once preparation begins.

### 4. “Capacity is work, not tickets”

Evidence: `B1` capacity units vary by menu item; `B1` slots require atomic reservation; `B1` managers need capacity controls.

Insight: A believable pickup calendar must account for preparation load, otherwise “available” slots will still overload the kitchen.

### 5. “Configurable without losing guardrails”

Evidence: `B1` multi-tenant data model; `B1` roles and shop assignments; `B1` organization branding and locale settings; `B1` server-side tenant isolation.

Insight: Configuration belongs in typed domain settings and policies, not scattered UI constants. Flexibility should expand the same safe workflows rather than create one-off behavior.

## Priority for design decisions

1. **P0 — Decide before the rush:** drives the customer first viewport, shop selection, menu density, and slot visibility.
2. **P0 — One queue, two entry points:** drives shared order status, queue cards, and merchant actions.
3. **P0 — A promise with useful uncertainty:** drives range language, status copy, and wait controls.
4. **P1 — Capacity is work:** drives slot math and item-level capacity units.
5. **P1 — Configurable guardrails:** drives the production architecture and the explicit MVP limitations of this front-end demo.

## Pattern confidence

All themes are single-source patterns because the brief is the only input. No participant sampling was available; future discovery should test the priority order with customers, counter staff, and managers separately.
