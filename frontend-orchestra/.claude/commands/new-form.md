---
description: Create a form (schema, component, mutation hook, tests) following the forms standard
argument-hint: "<feature> <form-name> <fields or contract schema name>"
---

Create the form: $ARGUMENTS

1. Load `form-rhf-zod`, `form-error-mapping`, `data-mutations` and `data-tanstack-query`. If any is missing from `.claude/skills`, stop and report it.
2. Locate the contract schema in `@scope/contracts`. If it does not exist, propose it (and the backend coordination needed) before continuing.
3. Create, inside the feature only: form schema derived from the contract plus `toXInput` mapper, messages in `messages.ts`, mutation hook, form component using `FormField`, and a colocated test.
4. Follow validation timing (submit first, then live), typed defaults, server-error mapping, idempotency key for creates, and the unsaved-changes guard.
5. Run `pnpm turbo run typecheck lint test --filter=...[HEAD]`, then delegate to `standards-reviewer` and `a11y-reviewer`.
6. Report files created and anything you assumed.
