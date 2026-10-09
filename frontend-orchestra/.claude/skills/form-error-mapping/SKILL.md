---
name: form-error-mapping
description: The RFC 9457 problem-details contract between NestJS and the frontend - the Zod schema in contracts, the ProblemError class, applyProblemToForm, the status-code to UX table, trace ids and message policy. Use whenever you handle an API error, map server validation errors to form fields, show an error toast or page, write fetchers, add backend error codes, or define the backend exception filter.
---

# Error mapping (RFC 9457 problem details)

RFC 9457 is the current problem-details standard (it supersedes RFC 7807 and keeps its members). The backend returns `Content-Type: application/problem+json`. This project adds two extension members: `errors` (field paths to messages) and `code` (stable machine-readable string), plus `traceId`.

## Contract (single source: `packages/contracts`)

```ts
// packages/contracts/src/problem.ts
import { z } from 'zod';
export const problemDetailsSchema = z.object({
  type: z.string().default('about:blank'),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(),                                   // e.g. "ORDER_ALREADY_SHIPPED"
  traceId: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),  // { "items.0.sku": ["Required"] } (dot paths match React Hook Form)
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
```

## ProblemError (frontend)

```ts
// src/lib/api/problem.ts
export class ProblemError extends Error {
  constructor(public readonly problem: ProblemDetails) { super(problem.title); this.name = 'ProblemError'; }
  get status() { return this.problem.status; }
  static async fromResponse(res: Response): Promise<ProblemError> {
    const parsed = problemDetailsSchema.safeParse(await res.json().catch(() => null));
    return new ProblemError(parsed.success ? parsed.data : { type: 'about:blank', title: res.statusText || 'Request failed', status: res.status });
  }
}
```

## Mapping into forms

```ts
// src/lib/api/apply-problem-to-form.ts
export function applyProblemToForm<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, knownFields?: ReadonlySet<string>): boolean {
  if (!(err instanceof ProblemError) || !err.problem.errors) return false;
  let handled = false;
  for (const [path, msgs] of Object.entries(err.problem.errors)) {
    const known = !knownFields || knownFields.has(path);
    setError((known ? path : 'root.server') as FieldPath<T>, { type: 'server', message: msgs[0] });
    handled = true;
  }
  return handled;
}
```

Returns `true` when field errors were applied. Unknown paths land on `root.server`, which `<FormRootError />` renders. A non-field failure with a message is shown by the caller as a toast.

## Status code to UX

| Status | Meaning | UX |
|---|---|---|
| 400 / 422 | Validation | Field errors via `applyProblemToForm`; root error for the rest |
| 401 | Session expired | Proxy already tried refresh; if still 401 → login with `next` |
| 403 | No permission | Toast from `messages` ("You don't have access"); hide the action next time via `can()` |
| 404 | Missing | `notFound()` on pages; toast for actions |
| 409 | Conflict | Message chosen by `code` (stale version, duplicate); offer reload |
| 429 | Rate limited | Toast; honor `Retry-After` |
| 5xx | Server failure | Generic message plus "Reference: {traceId}"; Sentry capture with the trace id |
| Network error | Offline/timeout | Retry affordance; no field errors |

## Message policy

- UI copy is chosen by `code` (map in `messages.ts`), with a generic fallback per status. `detail` is for logs and support, not for display.
- Field messages from `errors` may be shown as-is (they are validation text) until the backend sends codes per field; when i18n is on, the backend must localize or send codes.
- Never render `error.message` from unknown errors; never expose stack traces or SQL.

## Backend side

The backend repo owns the exception filter. A reference implementation and the rules it must follow are in `references/nestjs-exception-filter.md`. Keep the schema above and that filter in sync through `@scope/contracts` releases.

## Anti-patterns

- Parsing error bodies ad hoc in components.
- Different error shapes per endpoint.
- Showing `problem.detail` to users.
- Treating every non-2xx as "Something went wrong" (loses field errors).
- Mapping server paths to fields by string surgery instead of dot paths.
