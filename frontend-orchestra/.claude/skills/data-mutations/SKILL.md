---
name: data-mutations
description: Standard for every write operation - the useMutation hook shape, contract-validated input and output, which query keys to invalidate, optimistic-update limits, idempotency keys, double-submit prevention, error and toast policy, and post-success navigation. Use whenever you create, update, delete or trigger anything on the backend from the UI - forms, buttons, toggles, bulk actions, drag-and-drop reordering, uploads confirmation - or when a list does not refresh after a change.
---

# Mutations

Every mutation: **feature hook → `apiFetch` → BFF proxy → NestJS → invalidate**. No Server Actions, no direct `fetch` in components.

## Standard hook

```ts
// features/orders/hooks/use-create-order.ts
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrderInputSchema, orderSchema, type CreateOrderInput } from '@scope/contracts';
import { apiFetch } from '@/lib/api/client';
import { orderKeys } from '../api/keys';

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateOrderInput; idempotencyKey: string }) =>
      apiFetch('/orders', { method: 'POST', body: createOrderInputSchema.parse(input), schema: orderSchema, idempotencyKey }),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(order.id), order);          // response is the full entity
      return qc.invalidateQueries({ queryKey: orderKeys.lists() }); // narrowest key; returned so isPending covers the refetch
    },
  });
}
```

## Rules

| Topic | Standard |
|---|---|
| Input | Parse with the contract input schema before sending. Form-to-API mapping (`toCreateOrderInput`) lives in the feature (`form-rhf-zod`) |
| Output | Always parsed with the contract response schema |
| Invalidation | Narrowest affected keys from the key factory. Create → lists. Update → detail + lists. Delete → `removeQueries` detail + lists. Never `invalidateQueries()` unscoped |
| Awaiting | Return the `invalidateQueries` promise from `onSuccess` so the UI stays pending until fresh data lands (use when navigating to the list) |
| Next cache tags | Handled by the BFF (`data-bff-proxy`); the hook does not call `revalidateTag` |
| Retries | `retry: 0` (set globally). Safe retries only via an idempotency key |
| Idempotency | Creates that must not duplicate send an `Idempotency-Key`: generate `crypto.randomUUID()` once per submit **attempt** (store in a ref, reuse on retry, regenerate after success) |
| Double submit | Disable the trigger while `isPending`/`isSubmitting`; never rely on that alone for creates (idempotency key) |
| Optimistic updates | Only reversible, low-risk toggles. Pattern in `data-tanstack-query`. Never payments or server-generated IDs |
| Bulk actions | One endpoint call, not N parallel mutations. Report partial failure from the response |
| Navigation after success | Invalidate first, then `router.push`. `router.refresh()` only when server-rendered content outside the Query cache must update |

## Errors and feedback

1. Field errors (`ProblemError.problem.errors`) go to the form via `applyProblemToForm` (`form-error-mapping`).
2. Everything else shows one toast, from the **component** (`onError`) when it has a specific message, or from the global `MutationCache.onError` default. Mark mutations that handle their own errors with `meta: { silent: true }` to avoid double toasts.
3. Success toast only when the result is not obvious from the UI (not after navigating to the new item).
4. Copy comes from `messages.ts`; never show backend `detail` text raw. Always show the trace id for 5xx ("Reference: ...").

```tsx
const create = useCreateOrder();
const keyRef = useRef(crypto.randomUUID());
const onSubmit = form.handleSubmit(async (values) => {
  try {
    const order = await create.mutateAsync({ input: toCreateOrderInput(values), idempotencyKey: keyRef.current });
    keyRef.current = crypto.randomUUID();
    router.push(routes.order(order.id));
  } catch (e) {
    if (!applyProblemToForm(e, form.setError)) toast.error(messages.createFailed);
  }
});
```

## Anti-patterns

- `fetch` or `axios` calls inside components or event handlers.
- Invalidating everything, or invalidating nothing and calling `refetch()` on one query.
- Fire-and-forget mutations (`mutate`) when the next step depends on the result.
- Optimistic UI without rollback.
- Two toasts for one failure; raw server text in the UI.
- Generating a new idempotency key on every click.
