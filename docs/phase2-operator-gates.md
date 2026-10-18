# Phase 2 operator gates — not a Production authorization

## Hosted verification
The sandbox cannot request deployment hosts, including `vercel curl`. No Plan
scope removes that egress limit. Run on a trusted operator machine with Node 24:

1. Verify the deployment is Preview and belongs to this exact project using
   `vercel inspect <preview-host> --scope <authorized-team>`.
2. In Vercel → project → Settings → Deployment Protection → Protection Bypass for
   Automation, create/select a project-specific test secret. Supply it through
   protected runner inputs as VERCEL_AUTOMATION_BYPASS_SECRET, never a URL or log.
   Documentation: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
3. Set SECURITY_PREVIEW_URL and SECURITY_EXPECTED_PREVIEW_ORIGIN to the same exact
   verified HTTPS Preview origin. Run `node security/universal/hosted-smoke.mjs`.
   The script checks read-only unauthenticated routes, not authenticated behavior.
4. Using independently provisioned staging fixtures, execute real browser login,
   regular-user denial, owner access, idle/absolute expiry, revocation, CSRF,
   rate-limit and cross-tenant checks. Correlate metadata-only audit events.
   Never run repeated-request tests against real customers or Production.
5. Inspect read-only database identity/grants from the staging runtime. Confirm
   Preview does not receive Production credentials or access Production hosts.
6. Revoke the test bypass after verification. It bypasses deployment protection,
   NOT application authentication. Do not disable deployment protection.

## CI activation (BLOCKED here)
Review `security/ci/security-baseline.yml` and copy it to
`.github/workflows/security-baseline.yml` using an authorized maintainer account
with workflow write access. Source publication previously failed only with active
workflow files. No supported tool here grants that permission. The template has
contents:read, no application secrets, no deploy credentials, no migration steps,
no pull_request_target, and no Production database input. Application tests use
isolated fixtures. Builds are enabled only for compatible projects. Agrarian
build is deferred until its local/staging data-initialization side effects have
been independently reviewed. Required branch checks must NOT be enabled until a
real PR run validates the workflow. Action tags must be reviewed/pinned to vetted
full commit SHAs before high-assurance Production use; that pinning is pending.
Secret scanning is a high-confidence current tracked-file scan, not full-history
or entropy scanning. Native GitHub secret scanning should be separately enabled.

## Production gate and rollback
No merge into any Production branch is authorized. Review code separately from
release approval. Before release record backups, target identities, privileges,
provider approvals, hosted test evidence, incident owner and rollback deployment.
No database rollback may drop financial/customer/audit data just to restore code.
