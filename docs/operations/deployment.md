# JongFood deployment notes

> The root [DEPLOYMENT.md](../../DEPLOYMENT.md) is the current release contract. This page retains the original prototype notes for context.

## Current local walkthrough

Run locally with Node 18+:

```bash
npm install
npm run dev
```

The app is served at `http://localhost:4173`. Without `DATABASE_URL`, it uses the explicit memory adapter for local/test runs. `npm run build` verifies the static shell and server source; do not deploy the memory adapter as a production database.

## Production path

Before deployment, configure the server-backed application:

1. Add a managed PostgreSQL database and apply `db/migrations/001_initial.sql`.
2. Add secure sessions and organization/shop authorization.
3. Move order creation to a transaction with idempotency key and slot capacity locking.
4. Store timestamps in UTC and format using the organization time zone.
5. Proxy or self-host menu imagery and configure CSP/CORS for the chosen host.
6. Add CI for typecheck, lint, unit, integration, E2E, accessibility, and production build checks.
7. Set `APP_URL`, `DATABASE_URL`, store mode, locale, time zone, and currency as environment variables.

Do not deploy `JONGFOOD_STORE=memory` as a real multi-tenant ordering system; it cannot provide restart-safe identity, tenant isolation across instances, or concurrency safety.
