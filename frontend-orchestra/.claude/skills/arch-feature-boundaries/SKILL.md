---
name: arch-feature-boundaries
description: Rules for feature-based folders inside an app - anatomy of a feature, its public API (index.ts / server.ts), the ban on feature-to-feature imports, and the approved ways for features to cooperate. Use whenever creating, restructuring or extending a feature, whenever one feature needs data, UI or events from another, or whenever you are tempted to import from src/features/<other>. Also use when configuring ESLint boundaries.
---

# Feature boundaries

Each app uses `src/features/<name>/`. **A feature may import from itself, `src/lib`, `src/components` and `@scope/*` packages. It must never import from another feature.** Hooks block violations at edit time; ESLint blocks them at commit time.

## Anatomy

```
src/features/orders/
├── index.ts          # client-safe public API (components, hooks, types). Routes import ONLY from here
├── server.ts         # server-only public API (prefetchers, server fetchers). Starts with: import 'server-only'
├── components/       # feature UI. 'use client' only on interactive leaves
├── hooks/            # use-orders.ts, use-create-order.ts (Query + mutation hooks)
├── api/              # keys.ts (query key factory), fetchers.ts, mutations.ts
├── schemas/          # form schemas derived from @scope/contracts
├── messages.ts       # all user-facing copy
├── store.ts          # optional feature-local Zustand store
├── types.ts          # UI-only types (API types come from contracts)
└── *.test.ts(x)      # colocated tests
```

Rules:
- Two entry points matter: `index.ts` must never import server-only code; `server.ts` must never be imported by client components.
- Barrel files exist only at `index.ts`/`server.ts`. Inside a feature, import by relative path.
- Add `'use client'` per file that needs it. Never put it in `index.ts` (it would turn the whole feature into client code).

## When feature A needs something from feature B

| Need | Do this |
|---|---|
| Show B's UI inside A's page | **Compose in the route** (`src/app/.../page.tsx` imports both features) or accept B's UI as `children`/slot props from the route |
| Share an entity's data (both read `Customer`) | Promote the entity's query keys + fetchers to `src/lib/queries/customer.ts`; both features import from there |
| React to something B did | Invalidate shared query keys (from `src/lib/queries`) or use a shared Zustand store in `src/lib/stores` |
| Link to B's page | Route helpers in `src/lib/routes.ts` |
| Shared shape/type | `@scope/contracts` (API shapes) or `src/lib/types` (UI-only) |
| Shared UI piece | `src/components` (second feature) or `packages/ui` (second app, domain-agnostic) |

Promote by **moving** (never copy), update all imports, and delete the old file. See `arch-code-placement` for the promotion rule.

## Example

```tsx
// src/app/(app)/customers/[id]/page.tsx  (route composes two features)
import { CustomerHeader } from '@/features/customers';
import { CustomerOrdersTable } from '@/features/orders';

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next 15+: params is a Promise. Check the pinned version.
  return (
    <>
      <CustomerHeader customerId={id} />
      <CustomerOrdersTable customerId={id} />   {/* orders feature takes an id prop; it never imports customers */}
    </>
  );
}
```

```ts
// WRONG: features/orders/components/order-row.tsx
import { CustomerAvatar } from '@/features/customers';   // blocked by hook and lint
```

## ESLint enforcement (shape; syntax varies by plugin version, check the installed version's docs)

```js
// packages/config-eslint: flat config excerpt using eslint-plugin-boundaries
import boundaries from 'eslint-plugin-boundaries';
export default [{
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
      { type: 'app',     pattern: 'src/app/**' },
      { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
      { type: 'shared',  pattern: ['src/components/**', 'src/lib/**'] },
    ],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'app',     allow: ['feature', 'shared'] },
        { from: 'feature', allow: ['shared', ['feature', { featureName: '${from.featureName}' }]] },
        { from: 'shared',  allow: ['shared'] },
      ],
    }],
  },
}];
```

## Anti-patterns

- "Just this once" cross-feature import, or re-exporting another feature's internals through `src/lib`.
- A giant `shared/` dumping ground. Promote the specific thing to the specific home in `arch-code-placement`.
- Routes containing business logic. Routes compose features; logic lives in features.
- Features that read each other's Zustand stores or query keys directly.
