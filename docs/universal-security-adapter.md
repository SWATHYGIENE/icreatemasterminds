# Universal security adapter: icreatemasterminds

Registration: `security/project.json`. Source scan: `node security/universal/check.mjs`.
Policy tests: `node --test security/universal/policy.test.mjs`.

This versioned shared policy/checking bundle is a development foundation, NOT an
installed identity provider, live monitoring service, or proof the runtime is secure.
Identity adapter: no local user accounts; public application endpoint; circles reverse proxy.

The project retains its own identities, issuer, tenant and credentials. Cross-project
roles are denied unless an independently verified per-project grant explicitly allows
an action. Discovered projects get no privileges and no deployment approval.
Do not share application session cookies, database credentials or customer records.

CI uses read-only repository permissions and no application secrets. It never starts
an application, runs migrations or invokes billing/provider APIs. Pattern findings
require review and do not certify absence of vulnerabilities. Dependency advisories
at high/critical severity fail CI; exceptions need an owner, expiry and justification.

Before staging: prove the database, external messaging, billing, Blob and identity
configuration is independent of Production. Test real route enforcement using the
project's existing identity and storage adapters. Before Production: obtain explicit
owner approval; test rollback, recovery, revocation, alert delivery and audit retention.
No Production enforcement is authorized by this registration or workflow.

## CI activation
The workflow is supplied at `security/ci/security-baseline.yml` as an inactive
template. GitHub publication denied workflow-tree access. An authorized maintainer
must copy it to `.github/workflows/security-baseline.yml` after review. It is NOT
an active scheduled monitor until that step succeeds.
