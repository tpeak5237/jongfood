# JongFood product contract

## Job to be done

When a student has a short lunch break, they want to reserve food and a realistic collection window before leaving class so they spend less time in the peak queue.

When a vendor is serving a rush, they want a single, ordered work queue that makes the next preparation action obvious without navigating complex admin software.

## MVP workflows

1. Student signs in, browses vendors and menus, selects required modifiers, adds food, chooses a pickup slot, and confirms a pay-at-pickup order.
2. Student reloads and sees the server-backed order and status timeline.
3. Vendor staff sees only assigned vendor orders and moves them through pending, confirmed, preparing, and ready.
4. Student sees ready status and confirms pickup.
5. Staff can pause a vendor or mark an item unavailable within vendor scope.
6. Walk-in orders share the same queue model; ETA is always labelled an estimate.

## Roles

| Role | Primary job | Scope |
| --- | --- | --- |
| Student | Order and collect lunch | Own orders; public vendors in the campus |
| Vendor staff | Run the rush-hour queue | Assigned vendor(s) only |
| Manager | Operate assigned campus vendors | Organization/vendor scope |
| Organization admin | Configure the organization | Organization scope |

## Visual direction

Quiet, exact, reassuring. The visual anchor is a real preparation queue with prominent pickup time and estimated wait. Density is calm on the student path and information-forward on the vendor path; large actions are reserved for rush-hour state transitions. Space Grotesk/DM Sans with Noto Sans Thai keeps mixed Thai/English labels readable at approximately 390px.

## Exit criteria

A deployed test user must be able to login, choose a vendor, consume real slot capacity, place an order, reload it, have vendor staff process it, see ready status, and complete pickup. The flow must use server-side authorization and database-backed capacity before secondary features expand.
