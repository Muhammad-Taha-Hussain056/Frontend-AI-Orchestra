---
name: security-review
description: Perform a security-focused review of changed code, APIs, authentication, authorization, data access, and infrastructure-sensitive logic. Identify real vulnerabilities and provide actionable remediation.
---

# Security Review Skill

## Stack

- TanStack Start frontends (`apps/user`, `apps/agency`) — React SSR, TanStack Router, server functions (`.server.ts`)
- Hono.js API (`apps/api`) on AWS Lambda — the authoritative security boundary; never treat a frontend check as a substitute for it
- Background processors (`apps/sync-consumer`, `apps/sync-cron`, etc.) on ECS/EventBridge
- Better Auth (auth) + Stripe Connect (payments), Drizzle ORM over PostgreSQL (`services/database`)
- Third-party integration clients (LinkedIn, HubSpot, ProspectPro) in `services/integration-clients`
- GitHub Actions CI/CD, deployed via SST to AWS

## Primary rule

Review the actual implementation, not a hypothesis. Inspect `git status`/diff, read the changed files and their surrounding implementation, trace the request/data flow, and check whether a finding is actually reachable before reporting it. Do not report theoretical vulnerabilities without evidence they apply here.

## Severity

- **Critical** — auth bypass, RCE, complete tenant-isolation failure, arbitrary privileged access, large-scale data exposure, prod credential compromise.
- **High** — IDOR on sensitive resources, privilege escalation, authz bypass, account takeover, SQL/NoSQL injection, arbitrary file access, credential exposure.
- **Medium** — missing rate limiting on sensitive endpoints, excessive info exposure, weak validation with limited impact, CSRF risk in a real authenticated flow.
- **Low** — limited-impact weakness requiring unusual conditions.
- **Informational** — a real improvement that isn't currently exploitable. Never present these as vulnerabilities.

Use the highest severity justified by exploitability, required privileges, attack complexity, and data sensitivity — don't over-classify a theoretical improvement as Critical.

## What to check (only the areas the diff actually touches)

**Authentication** — `isAuthenticated` present where expected; tokens/sessions validated server-side (Better Auth), not trusted from the client; hiding frontend UI is never authentication.

**Authorization** — every protected route: who's requesting → what resource → what action → is it allowed. Check role checks, resource ownership, `isOrganisationMember(...)`, and agency-vs-company boundaries including `impersonateCompanyAccessByAgency` (an agency must only reach client companies it actually manages). Authorization must be enforced in `apps/api`, never only in the frontend.

**IDOR / tenant isolation** — for any `:id`-scoped endpoint, verify the authenticated user's organisation actually owns the resource, not just that they're authenticated. Watch for lookups like `findFirst({ where: eq(table.id, id) })` that should also filter on `organisationId` (directly, or via a join through `audience`/`shortlist`). Never trust a client-supplied `X-Organization-ID` or organisation id in a body without checking membership.

**Input validation** — server-side only, via the route's Zod validator (`createValidatorSchema`). Check body, query, params, headers, cookies, uploads for missing/incorrect validation, type confusion, oversized input.

**Injection** — raw string concatenation into a Drizzle `sql\`...\``fragment or`db.execute(...)`; shell commands (`exec`/`execSync`/`spawn`) built from user input; dynamic email/template rendering (`services/email`) driven by user content.

**XSS** — `dangerouslySetInnerHTML`, raw HTML rendering, unsanitized rich text, dynamic URLs. Normal React escaping is not a finding.

**TanStack Start** — server functions and route loaders/actions must re-check auth/authorization themselves, not trust the caller. Never let a secret reach `VITE_*` (anything with that prefix ships to the browser) — server-only secrets (Stripe secret key, integration client secrets, Better Auth secret) belong only in `apps/api`.

**Hono API** — for each changed route, check the actual middleware chain present (`isAuthenticated`, `impersonateCompanyAccessByAgency`, `isOrganisationMember(...)`, `validator(...)`) against what similar routes use, and whether the handler trusts `ctx.get('user')`/`ctx.get('organisationId')` rather than raw request values. This project avoids HTTP `DELETE` (routes use `POST /resource/:id/delete` instead per CLAUDE.md) — confirm those still carry the full chain; it's easy to assume a "delete" route needs less protection.

**Secrets & error handling** — no hardcoded API keys/DB credentials/OAuth secrets in changed files (placeholders like `YOUR_API_KEY` are not findings); handlers should throw `HttpError` with a safe message, not leak a raw stack trace/SQL/connection string to the client; no passwords/tokens/session cookies in logs.

**File upload / S3** — if touched: size/type/MIME validation, path traversal, storage authorization, signed-URL expiration, no object key a user can construct to reach another tenant's data.

**Rate limiting / CORS** — rate limiting only matters for login, OTP, password reset, token generation, expensive/AI calls, public APIs — flag only where its absence creates real abuse risk. No wildcard CORS with credentials. Don't report CSRF just because an endpoint exists — check whether cookies + browser behavior actually make it reachable.

**External services / CI/CD / dependencies** — webhook auth (Stripe, integration providers), credential handling for AWS/OAuth providers; GitHub Actions token permissions and secret exposure to PR-triggered code if `.github/`, `stack/`, or `sst.config.ts` changed; whether a new dependency is necessary, not an automatic finding.

## Output

```md
# Security Review

## Summary

<overall assessment>

## Findings

### [SEVERITY] <title>

**File:** `path/to/file.ts` (line/function)
**Issue:** <what's wrong>
**Impact:** <what an attacker gains>
**Evidence:** <why this implementation is actually vulnerable>
**Recommended Fix:** <specific, compatible with the existing architecture — e.g. "add isOrganisationMember('company') to this route, see apps/api/src/routes/tam/tam.routes.ts">

## Positive Security Observations

- <good practice already present>

## Final Assessment

<pass/fail rationale>
```

Every finding must answer: what's wrong, where, how it's exploitable, what breaks, how to fix it — evidence from the actual implementation, not "best practice wasn't followed." Don't report framework defaults that are already secure, controls already enforced upstream (e.g. by middleware), unreachable code paths, or pure style issues. Don't rewrite whole modules when a focused fix works.

The objective is **real, exploitable security problems** with minimal false positives.
