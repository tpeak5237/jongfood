# JongFood security model

## Trust boundary

The browser is untrusted. A vendor ID, item price, slot availability, order ID, or role shown by the client is never authorization. Every protected route resolves the session server-side and checks organization and vendor scope before mutation or read.

## Implemented controls

- HttpOnly, SameSite session cookie with hashed server-side token storage.
- Password verification with Node `scrypt` and timing-safe comparison.
- Tenant columns and composite foreign keys in PostgreSQL.
- Vendor-scoped staff authorization for queue, menu, and pause mutations.
- Owner-only pickup confirmation.
- Atomic capacity update inside the PostgreSQL order transaction.
- Idempotency key and payload fingerprint for duplicate submits.
- Authoritative menu price, availability, modifier, and capacity validation.
- Explicit status-transition validation and immutable status/audit records.
- JSON request size limit, CSP, `nosniff`, and strict referrer policy.
- HTML escaping in the existing client-rendered UI.

## Known deployment risks

The in-memory adapter is intentionally not production-safe across processes or restarts. A real deployment still needs managed Postgres backups, secret management, rate limiting, TLS, log redaction, session revocation policy, password-reset/account lifecycle, and external provider verification. These are live-proof gates, not claims made by local tests.
