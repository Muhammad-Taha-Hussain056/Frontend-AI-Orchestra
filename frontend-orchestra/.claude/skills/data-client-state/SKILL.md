---
name: data-client-state
description: Standard for client-side state - what belongs in URL state, React state, Zustand or (rarely) Redux Toolkit, and what never does; Zustand store patterns, SSR safety, persistence, reset on logout, and the gate for Redux Toolkit. Use whenever you need state that is shared between components, survives navigation, drives multi-step flows, stores UI preferences, or when someone proposes Redux, Context for state, or copying fetched data into a store.
---

# Client state

## Where state goes (first match wins)

| State | Home |
|---|---|
| Server data (entities, lists, anything from the API) | **TanStack Query**. Never a store |
| Filters, sort, page, tab, selected item that should survive refresh or be shareable | **URL search params** (parsed with Zod; `nuqs` if the project adopts it) |
| Local to one component or a small subtree | `useState` / `useReducer` |
| Form values | React Hook Form |
| Shared UI state across distant components (sidebar, command palette, toasts queue, wizard draft) | **Zustand** |
| Large normalized client-only state with complex workflows (offline editor, undo/redo graph) | Redux Toolkit **only after passing the gate below** |
| Theme | `next-themes` |

## Zustand standard

```ts
// features/orders/store.ts  (feature-local)   or   src/lib/stores/<name>.ts  (cross-feature)
'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { registerStoreReset } from '@/lib/stores/reset';

type OrderWizardState = { step: number; draft: Partial<OrderDraft>; setStep: (n: number) => void; patch: (d: Partial<OrderDraft>) => void; reset: () => void };
const initial = { step: 0, draft: {} };

export const useOrderWizard = create<OrderWizardState>()(devtools((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  patch: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
  reset: () => set(initial),
}), { name: 'order-wizard', enabled: process.env.NODE_ENV !== 'production' }));
registerStoreReset(() => useOrderWizard.getState().reset());
```

Rules:
1. **Always select**: `useOrderWizard((s) => s.step)`. Never `useOrderWizard()` (re-renders on every change). Use `useShallow` when selecting several fields.
2. Stores are **client-only modules** (`'use client'` importers). They are never read or written during server rendering; module state on the server would leak between requests.
3. If a store needs server-provided initial state, use a per-request store factory created in a client provider (`createStore` + context), as in the official Zustand Next.js guide.
4. Persistence (`persist` middleware) only for preferences and drafts: always `partialize`, set `version` and `migrate`, never persist tokens or PII.
5. Actions live inside the store; components never `setState` directly.
6. **Reset on logout:** every user-specific store registers with `registerStoreReset`; logout calls `resetAllStores()`.
7. Feature-local stores stay in the feature. A store used by a second feature moves to `src/lib/stores` (promotion rule).
8. No derived server data in stores. Derive in selectors or in the query's `select`.

## Redux Toolkit gate

Redux Toolkit is allowed only if **at least two** of these are true, and the reason is written in the PR:

1. The state is large, normalized and entirely client-owned.
2. You need middleware-driven workflows (listener middleware, complex async orchestration).
3. You need time-travel/undo with strict action logs.
4. The project already runs on Redux and migration is out of scope.

If allowed: `configureStore` inside a `makeStore()` factory created per request/provider, typed `useAppDispatch`/`useAppSelector`, slices with `createSlice`, no RTK Query (TanStack Query is the standard), same logout-reset rule. Otherwise use Zustand.

## Context is not a state manager

React Context is for dependency injection (theme, query client, session snapshot), not for frequently changing state. Frequently changing shared state uses Zustand.

## Anti-patterns

- Putting `useQuery` results into a store "for convenience".
- A single global mega-store; stores are small and named.
- `persist` without `partialize`/`version`.
- Reading a store in a Server Component.
- Redux added because "we always used it".
- State in the URL that is not parsed and defaulted (breaks on manual edits).
