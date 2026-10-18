# Universal Security Framework v1 — staged foundation

This bundle separates the **management plane** (inventory, policy, findings,
CI reporting) from the **application plane** (each app verifies identities,
roles, sessions, CSRF, tenants, audit writes and revocations independently).
It is not a new shared identity provider and does not replace application auth.

## Operating model

1. `node security/universal/discover.mjs swat12` enumerates paginated authorized
   Vercel projects via CLI. Run in each separately authorized scope. No tokens
   are stored in this repository. Discovery is read-only and grants nothing.
2. Assign a project-specific `security/project.json` after inspecting source,
   database isolation, external providers, account structures and environment metadata.
3. `node security/universal/check.mjs` reports conservative source findings.
   `node --test security/universal/policy.test.mjs` executes deny-by-default
   isolation and policy tests. Neither certifies runtime security.
4. Connect adapters only after independent identity/grant validation. `authorize`
   takes SERVER-verified identities and SERVER-loaded grants; passing it browser
   claims defeats the contract. Use existing provider SDKs to validate issuer,
   audience, signature, expiry, subject and revocation. Never merge by email.
5. Runtime session/revocation, rate-limit and append-only audit adapters need
   durable project-isolated stores. No in-memory production substitutes are supplied.
6. Require explicit, separately recorded owner approval for each Production
   rollout. A repository workflow or signed discovery event cannot approve it.

## Identity and migration compatibility

- My Reputation Pro: preserve PR #10 and its original owner IDs, sessions and
  WebAuthn tests. Its staging migration remains blocked. Do not spread its DB
  credentials, owner list, cookies, or physical-key RP configuration to other apps.
- JoinSWAT: retain Firebase SDK verified/revoked sessions and issuer+subject
  mapping. Reviewer subject+email is not replaced by email-only authorization.
- DDS: preserve per-site permissions; add separate admin-session/MFA adapter
  only after isolated Turso, Blob, setup/bootstrap and tenant tests exist.
- Agrarian: do not trust ADMIN_EMAILS for future grants. Migration to verified
  persistent user IDs requires reconciled owner identity, not automated email lookup.
  Financial ledger and ordinary customer accounts must stay distinct.
- Static marketing sites: no login requirement. Apply intake validation,
  secret-safe errors, headers, abuse controls and external-destination review.

## Future projects and webhook architecture

Read-only discovery can run in an operator-controlled scheduled runner. No hosted
schedule, webhook, API credential or unrestricted integration is activated here.
Project events require All Team Projects scope; verify Vercel's raw-body HMAC-SHA1
signature with constant-time comparison. GitHub uses HMAC-SHA256. The bundle
includes signature helpers and a **normalized-event contract** plus atomic replay
adapter; raw Vercel/GitHub payload mapping, GitHub delivery IDs, persistent replay
storage and a hosted receiver still need implementation and tests. Do not send
raw provider payloads to `acceptDiscovery` expecting production support.

Receiver responsibilities: authenticate raw bytes, validate permitted event and
scope, durably deduplicate, queue metadata-only discovery, then fetch authoritative
project/repository metadata under least privilege. Never fetch a webhook-supplied
URL, execute repository content, access application secrets or grant permissions
just because a webhook is signed. Reconcile periodically to catch missed events.
New projects enter discovered/unverified, not trusted or deployment-approved.

## Monitoring and audit

Consolidated inventory contains metadata and findings only. It is an offline
private report, NOT a public dashboard route or live SIEM. Never publish it to a
public static directory. `auditEnvelope` deliberately drops extra fields; it is a
serialization policy, NOT persistent/tamper-proof storage. Runtime adapters must
commit action+audit atomically and restrict runtime roles from audit updates,
deletes, truncation and DDL. Export to independent immutable retention with
per-project ingestion identity and authorization. No app can read another app's
audit or customer records by possessing the management-plane package.

Alerts need per-project delivery, deduplication, escalation and incident owner.
No external alert service is configured. Dependency CI runs without application
secrets and does not execute migrations or app code. Advisory scans fail on high/
critical findings; source findings remain needs-review, not auto-confirmed exploits.

## Rollout gates

- Phase A: scoped inventory and source findings; GitHub-unlinked and other-scope
  coverage must be explicitly reported.
- Phase B: shared pure policy engine plus independent adapter specifications.
- Phase C: tested development changes; database-side effects block Preview until
  isolated resources and identities are proved. Do not weaken gates for a READY badge.
- Phase D: persistent monitoring/identity/audit integration remains incomplete.
- Phase E: pure policy isolation tests are not hosted cross-project penetration tests.
- Phase F: Production plan requires owner approval, rollback, backups, recovery,
  least-privilege database grants, provider tests and an incident contact.

Documentation: https://vercel.com/docs/security/shared-responsibility
Webhook reference: https://vercel.com/docs/webhooks/webhooks-api
