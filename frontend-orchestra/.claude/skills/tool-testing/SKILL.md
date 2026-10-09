---
name: tool-testing
description: Testing standard - Vitest, React Testing Library, MSW and Playwright; what to test at which level, shared test utilities and setup, MSW handlers typed from contracts, testing hooks/forms/queries/mutations, Server Component strategy, E2E conventions, coverage and CI. Use whenever you write or change tests, fix a bug (regression test first), set up Vitest, Playwright or MSW, test a form, query, table or auth flow, or decide whether something needs a test.
---

# Testing

Stack (decision): **Vitest + React Testing Library + MSW + Playwright**. Pre-push runs unit/component tests; E2E runs in CI.

Version note: MSW 2.x handler syntax (`http`, `HttpResponse`) and Vitest config shape are assumed; confirm against the pinned versions (UNVERIFIED here).

## Pyramid

| Level | Tool | Covers |
|---|---|---|
| Unit | Vitest | Pure functions: date helpers, mappers (`toXInput`), schemas, `can()`, key factories, `safeRedirectPath` |
| Component / integration | Vitest + RTL + MSW | Client components, hooks, forms, tables with realistic network behavior |
| E2E | Playwright | A few critical journeys against a production build: login, create/edit core entity, checkout-like flows, permission redirects |

Prefer the lowest level that proves the behavior. Bug fix = failing regression test first.

## Conventions

- Tests are colocated (`thing.test.ts(x)`); E2E in `apps/<app>/e2e/`; shared helpers in `src/test/` (`test-utils.tsx`, `handlers.ts`, `factories.ts`).
- Names read as behavior: `describe('CreateOrderForm')` → `it('shows server field errors on the matching inputs')`.
- Query by **role/label/text** (`getByRole`, `getByLabelText`). `data-testid` only when nothing accessible exists. Use `userEvent`, not `fireEvent`.
- No snapshot tests of large trees; no testing implementation details (state, hook internals, class names).
- Tests are deterministic: fixed time, seeded data, no real network, no sleeps (use `findBy*`/`waitFor`).

## Setup essentials (templates in `templates/config/`)

- `vitest.config.ts`: jsdom environment, `setupFiles`, path aliases, `TZ=UTC` plus a second run under another zone for date tests, coverage provider.
- `vitest.setup.ts`: jest-dom matchers, MSW `server.listen({ onUnhandledRequest: 'error' })`, reset handlers after each test, mock `next/navigation` and `next/headers` where needed, skip animations (`ui-motion`).
- `test-utils.tsx`: `renderWithProviders(ui, { flags, session })` creating a **fresh `QueryClient` per test** (`retry: false`), theme and flags providers. Never reuse a client between tests.
- MSW handlers are typed with contract schemas so tests break when contracts change; error handlers return RFC 9457 bodies (`form-error-mapping`).

## What to test, by area

| Area | Test |
|---|---|
| Forms | Fill by label, submit, assert validation messages, the exact mutation payload (via MSW request body), server field-error mapping, double-submit prevention, success navigation |
| Query hooks/components | Loading skeleton → data; error state with retry; correct key invalidation after a mutation (assert refetch via MSW call count) |
| Tables | Sorting/pagination changes the URL state and requests; empty/loading/error states |
| Auth/permissions | Permitted and forbidden session for each gated screen; redirect behavior (E2E) |
| Middleware / route handlers | Unit-test pure helpers; BFF proxy via Request/Response tests (header allowlist, CSRF rejection, refresh single-flight) |
| Server Components | Async Server Components are impractical to unit test: keep them thin, test their data functions and client islands, and cover pages through E2E |
| Stores | Test actions and selectors; reset between tests (`resetAllStores`) |

## Playwright

- `webServer` runs the **production build** (`next start`) with test env vars; backend is a stub server or contract-faithful mock; no calls to real third parties.
- Auth once in a setup project, saved as `storageState`, reused by specs.
- Role/label locators; `expect` auto-waiting; trace and screenshot on first retry; retries only in CI.
- One spec per journey; independent data per test; no ordering dependencies.
- Accessibility is a manual checklist in this project (`ui-a11y-checklist`); E2E may include keyboard-path assertions for critical flows.

## Coverage and CI

Targets: `packages/utils` and mappers/schemas 90%+, other packages and features 70%+ lines, enforced as thresholds in CI, not as a reason to write meaningless tests. CI runs lint, typecheck, unit/component with coverage, build, then Playwright. Flaky tests are fixed or removed within the sprint, never retried into silence.

## Anti-patterns

- Mocking `fetch` by hand instead of MSW.
- Shared mutable `QueryClient`, or tests depending on order.
- `getByTestId` everywhere; `waitFor` with arbitrary timeouts.
- Asserting on implementation (hook calls) instead of user-visible results.
- Skipping or deleting a failing test to get green.
