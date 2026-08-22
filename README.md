# JongFood

JongFood (จองฟู้ด) is a Thai-first campus canteen pre-order and pickup-timeslot MVP. Students choose a vendor, customize food, reserve a capacity-aware pickup window, and track the order. Vendor staff operate one queue for pre-orders and walk-ins.

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:4173](http://localhost:4173). Without `DATABASE_URL`, the server uses the explicit in-memory adapter for local walkthroughs and Playwright; orders still go through server APIs and are never stored in browser localStorage. Production mode refuses to start without PostgreSQL.

Demo accounts:

- Student: `student@demo.jongfood.local` / `demo-student`
- Bai Tong staff: `staff@bai-tong.demo.jongfood.local` / `demo-staff`
- Khlong staff: `staff@khlong.demo.jongfood.local` / `demo-staff`

## Commands

```bash
npm run check          # syntax checks for the app and server modules
npm run lint           # ESLint
npm run typecheck      # JavaScript module/type-boundary smoke check
npm test               # domain and server-flow tests
npm run test:e2e       # Chromium + mobile Chromium Playwright suite
npm run build          # deployable static/server verification artifact
npm run db:migrate     # apply db/migrations/001_initial.sql
npm run db:seed        # seed the demo organization into PostgreSQL
```

## Product boundary

The MVP deliberately focuses on campus, canteen, pickup, timeslots, queue smoothing, and fast ordering. It does not include delivery dispatch, marketplace logistics, card storage, fabricated payment success, or vanity analytics. Payment remains an abstraction with `PAY_AT_PICKUP` and `MANUAL_CONFIRMED`.

## Architecture

- `app.js` — bilingual student and vendor UI; server-hydrated state and API mutations.
- `src/domain.mjs` — pure cart, capacity, wait-estimate, priority, and status-transition rules.
- `src/server/http-app.mjs` — HTTP routes, secure session cookie handling, JSON errors, CSP, and static serving.
- `src/server/memory-store.mjs` — deterministic local/test adapter; not a production source of truth.
- `src/server/postgres-store.mjs` — PostgreSQL implementation with transactions, atomic slot updates, tenant scope, and idempotency.
- `db/migrations/001_initial.sql` — organization/campus/vendor/menu/slot/order/payment/notification/audit/session schema.

Read the requested handoff documents: [PRODUCT.md](PRODUCT.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ORDER_ENGINE.md](ORDER_ENGINE.md), [CAPACITY_ENGINE.md](CAPACITY_ENGINE.md), [SECURITY.md](SECURITY.md), [TESTING.md](TESTING.md), [LIVE_PROOF.md](LIVE_PROOF.md), and [DEPLOYMENT.md](DEPLOYMENT.md).

## Current proof boundary

Local unit, server-flow, browser, responsive, and console checks are implemented. No staging deployment, managed database, production authentication provider, external notification provider, or real payment provider was available in this workspace; those remain explicit live-proof gates.
