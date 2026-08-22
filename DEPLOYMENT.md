# JongFood deployment

## Required environment

```text
NODE_ENV=production
APP_URL=https://staging.example.com
DATABASE_URL=postgres://...
JONGFOOD_STORE=postgres
JONGFOOD_AUTO_MIGRATE=false
SESSION_SECRET=<secret-manager-value>
DEFAULT_TIME_ZONE=Asia/Bangkok
DEFAULT_CURRENCY=THB
```

Do not use `JONGFOOD_STORE=memory` in production. Do not put credentials in `.env.example`, seed fixtures, screenshots, or CI logs.

## Release sequence

1. Build and run `npm run check`, `npm run lint`, `npm run typecheck`, `npm test`, and both Playwright projects.
2. Provision staging PostgreSQL and run `npm run db:migrate` with the staging `DATABASE_URL`.
3. Seed only a dedicated demo/staging organization with `npm run db:seed` if needed.
4. Start the Node server with `npm run dev` equivalent in the host process manager, or deploy the project through the chosen Node-compatible host.
5. Run the live proof register against HTTPS.
6. Promote only after database, auth, capacity, tenant, and pickup evidence is captured.

## Operations

Expose `/api/health` to the platform health check. Monitor order creation failures, capacity conflicts, status-transition errors, database latency, session failures, late orders, and sold-out items. Keep database migrations reversible and take a backup before production schema changes.

## Current limitation

No staging provider, hosted database, or live URL was configured in this workspace. Deployment configuration is present, but live proof remains open and is not claimed by the local verification results.
