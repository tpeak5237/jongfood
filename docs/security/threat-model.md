# JongFood threat model

> Current controls are tracked in [SECURITY.md](../../SECURITY.md). This matrix is retained as the threat-model checklist.

## Assets

- Customer identity and order history.
- Organization, canteen, shop, menu, price, and capacity configuration.
- Queue status and operational data.
- Payment status and audit history.

## Primary threats and controls

| Threat | Required production control | Current demo status |
| --- | --- | --- |
| Cross-tenant data access | Derive organization/shop scope from the authenticated session; never trust client IDs | Server checks + composite Postgres foreign keys |
| Price or capacity tampering | Re-read authoritative menu and slot rows inside a transaction | Server re-reads menu; Postgres adapter updates slots atomically |
| Duplicate checkout | Require an idempotency key scoped to customer and organization | Key + payload fingerprint |
| Overselling the final slot | Row lock or atomic conditional update on order and capacity units | Atomic conditional update in Postgres; serial memory adapter for tests |
| Unauthorized status changes | Domain transition service plus role/shop authorization | Server enforced |
| Sensitive priority abuse | Manager-only override with reason and immutable audit log | Priority model and audit shape present; override UI deferred |
| XSS from menu or notes | Validate input, encode output, use CSP | Sample data is static and escaped before interpolation |
| Secret leakage | Environment variables, secret manager, no credentials in seed/docs | No secrets are present |
| Payment exposure | Provider tokenization; never store card details | Pay-at-shop only |

## Security assumptions

The browser is an untrusted client. The production implementation must enforce authorization and validation on every protected operation and must not use UI visibility as a security boundary. Logs should avoid sensitive priority reasons and customer data beyond operational need.
