# Ecosystem agents

Seven implemented agents share a bounded OpenAI tool runner and private task store in MyReputationPro. GoHighLevel is the optional internal task destination. No n8n or Grok dependency is required.

| Agent | What it produces | Data source |
|---|---|---|
| Ecosystem Coordinator | Assignments for the six specialists, saved with parent/child task IDs | MRP aggregate counts and ecosystem resources |
| Market Learning | One-segment launch experiments, assumptions and success/stop criteria | Authorized platform aggregate counts and supplied interview notes |
| Member Success & SWAT Operations | Service scopes, missing information, fulfillment plans | Selected authorized SWAT job and public provider candidates |
| Reputation & Retention | Profile activation plan, neutral feedback invitation, retention steps | Member's MRP progress and holds |
| Testimonial Steward | Edits to the author's own account, or neutral feedback questions | Own authored MTP records and firsthand supplied text |
| Trade Matching | Evidence-backed shortlist and unanswered fit questions | Active listings in one selected AE exchange and approved categories |
| Community Facilitator | Agendas, discussion summaries and proposed action lists | Selected circle and visible posts after membership checks |

## Workspaces

- MRP/MTP: `/agents` (operator sees all seven; members see five specialists). Coordinator and Market Learning require the existing operator allowlist.
- AgrarianExchange: `/agents?exchange=credit` or `exchange=commodity`. Circle pages include a scoped facilitator link.
- iCreateMasterminds: `/agents` redirects to AgrarianExchange's community agent. Existing circle identity remains authoritative.
- SWAT Network: `/#/agents`, with a selected authorized job or intake only.

Use Coordinator's example to create specialist assignments, then select **Run queued assignments**. Each specialist has its own result, sources, tool trace and pending drafts. Review, approve/dismiss, copy or mark a draft done. Approval does not publish, send, settle, book, dispatch or charge. There are no outbound customer-message tools.

The central coordinator does not join private identities across platforms. Its remote specialists can plan from the supplied brief and public resource facts; to analyze a real AE listing/circle or SWAT job, use that platform's native workspace. There is no automatic import of another member's remote records. No live web/interview collection or cross-platform conversion attribution is claimed.

## Configuration

Hub (MRP Vercel server):

- `OPENAI_API_KEY`: reuse the existing server connection. Never put it in frontend variables.
- `ECOSYSTEM_AGENT_MODEL`: defaults to `gpt-4o-mini`.
- `ECOSYSTEM_AGENTS_ENABLED=false`: emergency processing pause (default enabled when configured).
- `ECOSYSTEM_AGENT_DAILY_MODEL_CALLS`: global daily call cap, default 100, constrained to 1–500.
- `ECOSYSTEM_AGENT_AGRARIAN_SECRET`, `ECOSYSTEM_AGENT_SWAT_SECRET`: separate random 32+ character bridge keys.
- Existing `CRON_SECRET`: authenticates the five-minute queue drain and retention cleanup.
- `ECOSYSTEM_GHL_WEBHOOK_URL`: dedicated internal task workflow URL, server only.
- `ECOSYSTEM_GHL_ENABLED=true`: only after the mapped workflow is verified; handoff also requires `VERCEL_ENV=production`.

Each native server (AE Vercel / SWAT Cloud Run):

- `ECOSYSTEM_AGENT_BRIDGE_SECRET`: matching source-specific hub key.
- `ECOSYSTEM_AGENT_HUB_URL`: production defaults to `https://myreputationpro.com`; preview must explicitly point at the corresponding MRP preview.
- `ECOSYSTEM_AGENT_HUB_BYPASS`: optional protected-preview automation credential, never client side.
- `ECOSYSTEM_AGENTS_ENABLED=false`: disable native handoff.

Use different bridge keys in preview and production. Existing API relay secrets are intentionally not reused. AE previews require an isolated database; its existing build runs migrations. Never copy production DATABASE_URL into preview. SWAT's Vercel preview still routes API requests to the separately deployed backend until an isolated backend preview is configured. Do not mistake a successful frontend build for a deployed backend feature.

## Runtime and data boundaries

Runs are durable records in the existing `portal_records` table, with owner-qualified remote identities, immutable source scope, idempotent request IDs, exclusive worker leases and atomic result/draft/delegation commits. No DB migration is needed. A cancellation wins against a concurrent completion. Failed or stale tasks do not retry automatically. Explicit user submissions are drained by cron; cron does not enroll members or invent recurring tasks.

A run allows at most 5 model calls, 10 tool calls, 3 drafts and 80 seconds, plus per-request provider timeouts. A coordinator can assign at most six distinct specialists with no recursive delegation. Default daily root task caps are 6/member and 20/operator; model-call caps are 30/member and 100/operator, within the shared global cap. Actual costs depend on provider pricing and use.

Facts and bodies are size bounded. Source IDs must come from tools the agent actually read. Unknown tools, invented source IDs, unsupported draft kinds and incomplete outputs fail closed. Model text remains untrusted; human factual review is still required. Selected circle access and job authorization are checked before and after hub requests. A revocation during processing can leave a private hub result but prevents the native API from returning it and future reads from exposing it.

Private tasks and drafts expire after 30 days, on the scheduled cleanup (subject to scheduler availability). Operational audit metadata may follow the existing audit retention. OpenAI calls set `store:false`; this does not claim zero provider retention. Native screens require explicit AI-processing consent before transmitting the selected records.

## GHL internal task mapping

Create an inbound-webhook workflow with re-entry enabled: find/create **operator contact by email**, add an internal note, then create a legacy contact task. Map `task_title` to title and `task_summary` plus `operator_url` and `event_id` to body. Do not add SMS, email, customer-contact creation, or publishing actions. Keep Draft until a synthetic sample has verified all mappings and a responsible assignee is chosen.

Payload: `schema=ecosystem.agent-task.v1`, `event_id`, `agent`, `task_title`, `task_summary`, operator `email`, `full_name`, `owner_ref`, `operator_url`, `mode=internal_task_only`, `occurred_at`. Only an approved, owned draft can be exported by an operator. A 2xx response means accepted, not task creation proven. Uncertain delivery is held for manual execution-log reconciliation; do not blindly resend. Event ID is the reconciliation reference.

## Validation

MRP: `npm run test:agents`, `npm run typecheck`, `npm run build`; real Next/Postgres HTTP checks in `node scripts/test-activation-server.mjs` on a non-root runner. Agent tests exercise all seven tool loops, delegation, leases, persistence, owner isolation, idempotency, budgets, source validation, cancellation and GHL gates using synthetic data.

AE: `node --import tsx --test tests/ecosystem-agents.test.ts`, `npm run typecheck`, `npm run build`. Tests use migrated PGlite for exchange/category/listing/circle authorization and signed relay validation.

SWAT: `npm test -- agents.test.ts`, `npm run build`, `npm run build --prefix apps/web`. Tests cover role/job filters, scoped records, consent, action validation and signed relay restrictions.

Production rollout remains separate from code readiness. Deploy the hub, configure source-specific secrets, deploy native adapters, verify a synthetic task from each native workspace, then activate any selected internal GHL handoff. Preserve the existing Agrarian production hold. No production merge or customer enrollment is part of the preview build.
