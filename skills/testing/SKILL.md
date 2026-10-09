---
name: testing
description: Write unit and API tests for the behavior a diff actually changed — scoped, not a full coverage audit. Follows this repo's Vitest, mock-first testing rules.
---

# Testing

Write tests for what the diff actually changed — not a full coverage audit
of the surrounding code. Triggered via `/testing`, or automatically by the
pre-commit hook (`scripts/review/run-commit-tests.mjs`) against the staged
diff, which stages whatever you write so it lands in the same commit. Going
broad on every change is what makes that slow, not what makes it good.

Before writing anything, read **`.claude/rules/tests.md`** — that file is
the canonical source for this repo's testing rules (mock-first fixtures,
`@linked-modules` headers, co-location, scoped test runs) and overrides the
general guidance below wherever the two disagree.

## Scope first

- Test the behavior the diff changed. A copy tweak, a config change, or a
  rename doesn't need new tests; a new handler, a changed validation rule,
  or a changed calculation does.
- Package/apps here already use Vitest (`apps/api`, `apps/user`,
  `services/integration-sync`, `services/integration-clients`) — if the
  touched package has no test runner configured, **don't bootstrap one**:
  no new `vitest.config.*`, no new `test` script, no new setup file. Adding
  a test framework to a package is an infrastructure decision for a human
  to make deliberately, not a side effect of testing one change. Skip
  testing that file and say so in your summary instead.
- If a test file already exists for the changed code, extend it — don't
  create a second, parallel one. Tests are co-located as `*.test.ts` /
  `*.test.tsx` next to the source file.
- From the checklist below, cover only the categories the diff actually
  touches. Most changes touch 1-3 of these, not all of them.

## Always identify

- What behavior is being tested.
- The happy path for the change.
- The specific edge case(s) the diff introduces or changes — not every edge
  case the function could theoretically have.
- Validation/auth/authz failure cases — only if the diff touches
  validation, auth, or organisation/agency-impersonation authorization.

## Backend (Hono API)

For a new/changed API endpoint (`apps/api/src/routes/**`), cover the status
codes actually reachable through the change (the success case, plus
whatever `HttpError` cases the handler itself throws) — not the full
200/201/400/401/403/404/409/500 matrix by default. Mock `@/db`,
`drizzle-orm`, and any external SDK clients per `.claude/rules/tests.md` —
never hit a real database or external API.

## Frontend

For a changed component or hook (`apps/user/src`, `apps/agency/src`), cover
rendering plus the specific interaction or state change in the diff — not
the full rendering/interactions/validation/loading/error/empty-state
checklist unless the diff actually touches each of those. Mock
`@/hooks/useRequest` rather than making real network calls.

## Test quality

Tests must:

- Be deterministic.
- Be independent.
- Avoid unnecessary mocking.
- Test behavior rather than implementation details.
- Use realistic, hardcoded fixtures declared in the test file — not data
  pulled from a live database.
- Clean up after themselves.

Before writing tests, inspect the existing testing framework and follow the
project's conventions. If there isn't one for this package, stop and say so
instead of creating one.
