# Live proof register

## Verified locally

| Evidence | Result |
| --- | --- |
| Node syntax/check | Passing |
| ESLint | Passing |
| Domain + server-flow tests | 7 passing |
| Chromium Playwright | 6 passing |
| Mobile Chromium Playwright | 6 passing |
| 390px overflow check | `scrollWidth === innerWidth` |
| Manual browser console | 0 errors, 0 warnings |

## Not live proof

Localhost HTTP 200, a local build, a pushed commit, a GitHub Actions configuration, or an in-memory adapter does not prove production authentication, PostgreSQL persistence, deployment health, payment correctness, notification delivery, or multi-instance concurrency.

## Required staging proof

1. Apply the migration to a dedicated staging PostgreSQL database.
2. Seed or provision separate student and vendor test identities.
3. Run the complete Playwright flow against the deployed HTTPS URL.
4. Run two concurrent order claims against the final slot and confirm one succeeds and one receives `CAPACITY_EXHAUSTED`.
5. Verify tenant isolation, session expiry, logs, health checks, rollback, backup, and provider failure behavior.

Until those steps have direct evidence, the product status is **NOT READY for production**.
