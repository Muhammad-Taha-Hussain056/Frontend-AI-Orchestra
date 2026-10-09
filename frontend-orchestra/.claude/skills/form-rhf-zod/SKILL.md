---
name: form-rhf-zod
description: The standard for every form - React Hook Form with Zod, deriving form schemas from @scope/contracts, typed defaults, the shared FormField wrapper, validation timing, submit flow through useMutation, edit forms, field arrays, multi-step wizards, dependent fields, unsaved-changes guard, accessibility and i18n of messages. Use whenever you build or change any form, input, validation rule, multi-step flow, repeating rows, settings page or login/register screen, or hit Zod/resolver typing errors.
---

# Forms: React Hook Form + Zod

Version note: resolver and Zod typing differ between Zod 3 and Zod 4 and between `@hookform/resolvers` majors. Read the pinned versions from session context. With Zod 4, avoid `z.coerce.*` for form fields (its input type becomes `unknown` and breaks generics); convert in the field component instead. Confirm exact typing in the docs of the pinned versions (UNVERIFIED here).

## Schema flow (never redefine what the backend already defines)

```
packages/contracts   createOrderInputSchema   (API shape: strings for ids/dates, numbers as numbers)
        │  derive (.extend / .pick / .omit / .refine)
features/orders/schemas/create-order-form.ts   createOrderFormSchema  (what inputs actually hold)
        │  map once, at submit
features/orders/schemas/create-order-form.ts   toCreateOrderInput(values) → CreateOrderInput
```

```ts
// features/orders/schemas/create-order-form.ts
import { createOrderInputSchema, type CreateOrderInput } from '@scope/contracts';
import { z } from 'zod';
import { messages } from '../messages';

export const createOrderFormSchema = createOrderInputSchema
  .extend({
    deliveryDate: z.date({ error: messages.form.deliveryDateRequired }),   // picker yields Date; API wants ISO string
    notes: z.string().max(500, messages.form.notesTooLong).optional(),
  });

export type CreateOrderFormInput = z.input<typeof createOrderFormSchema>;
export type CreateOrderFormValues = z.output<typeof createOrderFormSchema>;

export const toCreateOrderInput = (v: CreateOrderFormValues): CreateOrderInput => ({
  ...v,
  deliveryDate: v.deliveryDate.toISOString(),                          // single mapping point, even when it is identity
});
```

Rules: validation messages come from `messages.ts` (or translated keys when i18n is on), never inline literals. Use `z.input` for field types and `z.output` for submit values. Cross-field rules use `.refine`/`.superRefine` with `path`.

## The form component

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, Input, Button } from '@scope/ui';

export function CreateOrderForm() {
  const router = useRouter();
  const create = useCreateOrder();
  const keyRef = useRef(crypto.randomUUID());

  const form = useForm<CreateOrderFormInput, unknown, CreateOrderFormValues>({
    resolver: zodResolver(createOrderFormSchema),
    defaultValues: { customerId: '', quantity: 1, notes: '' },          // ALWAYS provide defaults for every field
    mode: 'onSubmit',                                                   // validate on submit first...
    reValidateMode: 'onChange',                                         // ...then live after the first attempt
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const order = await create.mutateAsync({ input: toCreateOrderInput(values), idempotencyKey: keyRef.current });
      keyRef.current = crypto.randomUUID();
      router.push(routes.order(order.id));
    } catch (e) {
      if (!applyProblemToForm(e, form.setError)) toast.error(messages.createFailed);
    }
  });

  useUnsavedChangesGuard(form.formState.isDirty && !form.formState.isSubmitSuccessful);

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField control={form.control} name="quantity" label={messages.form.quantity}>
          {({ field }) => <Input type="number" inputMode="numeric" {...field}
            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />}
        </FormField>
        <FormRootError />                                               {/* shows formState.errors.root?.server */}
        <Button type="submit" loading={form.formState.isSubmitting}>{messages.form.submit}</Button>
      </form>
    </Form>
  );
}
```

## Standards

| Topic | Standard |
|---|---|
| Fields | Only through `FormField` from `@scope/ui` (wraps `Controller` and the shadcn form primitives; renders label, description, error, `aria-invalid`, `aria-describedby`, required marker). Never `register` onto custom components |
| Defaults | Required for every field; `''` for text, explicit values for selects/numbers. Prevents uncontrolled-to-controlled warnings |
| Timing | `mode: 'onSubmit'`, `reValidateMode: 'onChange'`. Focus moves to the first invalid field (`shouldFocusError` stays on) |
| Submit | `handleSubmit` → `useMutation` (`data-mutations`) → map server errors (`form-error-mapping`). Disable while submitting. `noValidate` on `<form>` so Zod owns validation |
| Async checks (unique email) | Debounced query on blur, not inside the resolver |
| Number/date inputs | Convert in the field `onChange`; keep schema input types honest |
| Reading values | `useWatch` for dependent fields; avoid `watch()` at form root (re-renders everything) |
| Reset | After success on a form that stays mounted: `form.reset(values)` |
| Files | Upload separately (presigned flow); the form holds the returned file key/URL |

## Edit forms

Load with a query (server-prefetched), pass `values` (or `reset(data)` once) so the form syncs when data first arrives. The query uses `refetchOnWindowFocus: false`, so a background refetch never wipes dirty edits. Send only changed fields when the API supports PATCH (`form.formState.dirtyFields`).

## Field arrays

```tsx
const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
fields.map((f, i) => <ItemRow key={f.id} index={i} onRemove={() => remove(i)} />)   // key is f.id, never the index
```

Schema: `z.array(itemSchema).min(1, ...)`. Provide a complete default item for `append`. Field paths in server errors (`items.0.sku`) match RHF paths directly.

## Multi-step wizards

One Zod schema per step plus a merged final schema (`stepOne.merge(stepTwo)`). The draft lives in a Zustand store (`data-client-state`) so refresh-safe persistence is optional and explicit. Next step: `await form.trigger(stepFieldNames)` before advancing. Final submit parses the merged schema.

## Unsaved changes

`useUnsavedChangesGuard(isDirty)` (in `src/lib/hooks`) registers `beforeunload` for hard navigation. The App Router has no route-change veto, so in-app navigation uses an explicit confirm dialog on Cancel/Back buttons and on the shared `Link` used inside forms.

## Accessibility

Visible label for every control (never placeholder-only); errors announced via `aria-describedby` and `role="alert"` on the root error; required fields marked in the label; autocomplete attributes for personal data (`autoComplete="email"`); focus lands on the first error after a failed submit; buttons are real `<button type="submit">`.

## Tests

Test with Testing Library: fill by label, submit, assert validation messages and the mutation payload through MSW (see the testing skill).

## Anti-patterns

- Hand-copied Zod objects that duplicate a contract schema.
- `defaultValues` missing or `undefined` for inputs.
- `register` on Radix/shadcn components; `watch()` for everything.
- `z.coerce.number()` with Zod 4 and `useForm` generics.
- Validating in `onChange` from the first keystroke (hostile UX) unless a field is a live search.
- Inline error strings; showing backend `detail` text raw.
- Submitting with `fetch` instead of the mutation hook.
