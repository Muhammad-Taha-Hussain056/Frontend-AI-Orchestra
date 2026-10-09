---
name: arch-code-placement
description: Decision rules for where any file or piece of code goes (feature, src/components, src/lib, packages/*), plus naming, import-alias and barrel conventions and the promotion rule. Use every time you create a file, move code, name something, or ask "where should this live?" - components, hooks, utils, schemas, query keys, stores, providers, env access, route helpers, types, tests and stories.
---

# Code placement

## The promotion rule

Code starts in the narrowest home and moves **up** only when a second consumer exists.

```
feature folder  →  src/components | src/lib (app shared)  →  packages/* (shared by apps)
   1 feature            2+ features in one app                  2+ apps
```

Moving up means: move the file, update every import, delete the original. Never copy. Never create a shared home "in case".

## Where things go

| Thing | Home |
|---|---|
| Route, layout, loading, error, not-found | `src/app/**` (thin; compose features) |
| BFF catch-all proxy | `src/app/api/[...path]/route.ts` |
| Component used by one feature | `features/<f>/components/` |
| Component used by 2+ features | `src/components/` |
| Domain-agnostic component used by 2+ apps | `packages/ui` (with a story) |
| Hook / query keys / fetchers / mutations | `features/<f>/hooks`, `features/<f>/api` |
| Entity data used by 2+ features | `src/lib/queries/<entity>.ts` |
| Zod schema mirroring an API shape | `packages/contracts` |
| Form schema (derived from contracts) | `features/<f>/schemas/` |
| Zustand store, one feature | `features/<f>/store.ts` |
| Zustand store, cross-feature | `src/lib/stores/<name>.ts` |
| Providers (Query, Theme, etc.) | `src/lib/providers/` (client file each); mounted in root `layout.tsx` |
| Env access | `src/lib/env.ts` (Zod-validated; separate server and client schemas) |
| Route path builders | `src/lib/routes.ts` |
| API client / BFF fetch wrapper | `src/lib/api/` |
| Pure helper, one feature | inside the feature |
| Pure helper, 2+ features | `src/lib/utils/` |
| Pure helper, 2+ apps | `packages/utils` |
| User-facing copy | `features/<f>/messages.ts` (app-wide: `src/lib/messages.ts`) |
| API types | from `@scope/contracts`; UI-only types in `features/<f>/types.ts` |
| Unit/component test | colocated: `thing.test.ts(x)` |
| E2E test | `apps/<app>/e2e/` |
| Storybook story | beside the component: `button.stories.tsx` |

## Naming

- Files and folders: `kebab-case`. Components: `PascalCase` exports, one component per file (`order-row.tsx` exports `OrderRow`).
- Hooks: `use-<thing>.ts` exporting `useThing`. Query key factories: `<entity>Keys`. Zod schemas: `<name>Schema`; inferred types: `<Name>`.
- Booleans read as questions: `isOpen`, `hasError`. Event props: `onSubmit`; handlers: `handleSubmit`.
- No default exports except where Next requires them (`page`, `layout`, `route` handlers, `loading`, `error`).

## Imports

- Alias `@/` maps to the app's `src/`. Packages by name (`@scope/ui`). Never reach into another workspace by relative path.
- Inside a feature use relative imports. To reach shared code use `@/lib/...` or `@/components/...`.
- Order: node/react → third-party → `@scope/*` → `@/` → relative → styles. Prettier/ESLint sort it; do not hand-sort.
- Barrels only at feature `index.ts`/`server.ts` and package entry points. Elsewhere import the file directly (tree-shaking, cycle avoidance).

## Worked example

"Add an order status badge." One feature uses it → `features/orders/components/order-status-badge.tsx`. Next week `customers` needs it too → move to `src/components/order-status-badge.tsx` and update both imports. When a second app needs it and it knows nothing about orders (e.g. a generic `StatusBadge`) → `packages/ui` + story.

## Anti-patterns

- `utils.ts` or `helpers.ts` grab-bags. Name files by what they do (`format-currency.ts`).
- Putting a component in `src/components` because it "might be reused".
- Barrel files that re-export everything (hide cycles, break tree-shaking).
- Business logic inside `src/app/**` route files.
- Reading `process.env` directly outside `src/lib/env.ts`.
