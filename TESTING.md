# JongFood testing

## Local commands

```bash
npm run check
npm run lint
npm run typecheck
npm test
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chromium
npm run build
```

## Coverage

- Pure rules: totals, capacity units, near-full/full slots, wait ranges, priority, and legal status transitions.
- Server flow: required modifier validation, authoritative capacity exhaustion, idempotent replay, and cross-vendor authorization.
- Browser Chromium and mobile Chromium: login, browse vendors/menu, modifier validation, add to cart, pickup slot, order creation, reload persistence, vendor queue transitions, student ready state, pickup, capacity conflict, and 390px overflow.
- Browser console: the manually exercised local flow completed with zero errors or warnings.

## Test data

The memory adapter seeds one organization, three vendors, two vendor users, a student, capacity-aware slots, and realistic queue records. It is deterministic enough for local tests but should never be treated as production persistence.

## Gaps

No managed Postgres concurrency run, authenticated staging E2E, external notification delivery, payment provider callback, load test, backup/restore drill, or accessibility assistive-technology run was proven in this workspace.
