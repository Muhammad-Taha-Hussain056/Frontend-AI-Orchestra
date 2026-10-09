---
name: next-rendering-modes
description: Decides and configures the rendering mode and caching of each Next.js route - static, ISR, dynamic SSR, streaming with Suspense, client-heavy shells, PPR - plus loading/error/not-found files and the rule against caching per-user data. Use whenever you create a route or page, touch fetch caching or revalidation, use cookies()/headers(), add loading.tsx, error.tsx or Suspense, configure revalidate/dynamic/generateStaticParams, or when a page is unexpectedly slow, stale or fully dynamic.
---

# Rendering modes and caching

## Step 0: know the version

Next.js caching semantics changed between major versions. Read the pinned `next` version from the session-start context, then open `references/by-version.md` for that version. If the version is not covered there or an item is marked UNVERIFIED, check the official docs for that version before writing caching code. Never apply caching APIs from memory of a different version.

## Choose the mode

| Page type | Mode | Notes |
|---|---|---|
| Marketing, docs, legal; content changes only on deploy | **Static (SSG)** | No cookies/headers. `generateStaticParams` for dynamic segments |
| Public content that changes on a schedule (catalog, blog, listings) | **ISR** | Set an explicit revalidate window and tags; document why that window |
| Authenticated or per-user pages (dashboards, orders, settings) | **Dynamic (SSR)** | Reads the session cookie, so it is dynamic by nature. Server prefetch into TanStack Query |
| Slow secondary sections on any page | **Streaming** | Wrap in `<Suspense fallback>`; the shell renders immediately |
| Highly interactive tools behind login (editors, boards) | **Dynamic shell + client-heavy** | Server layout/data, large client island; keep the island lazy-loaded |
| Mixed static shell + dynamic holes | **PPR / cache components** | Opt-in per project, only when the pinned version supports it. Default: off |

When in doubt: public and identical for everyone → cache it. Anything depending on who is asking → dynamic.

## Rule: never cache per-user data in a shared cache

Anything that reads the user's cookie, session or token must not use `force-cache`, `revalidate`, `use cache` or `unstable_cache` keyed without the user. A shared cache would serve one user's data to another. Per-user fetches use `cache: 'no-store'` (or are dynamic through `cookies()`), and the Query cache provides client-side reuse.

```ts
// features/orders/server.ts   per-user: explicitly uncached on the server
import 'server-only';
import { cookies } from 'next/headers';

export async function getOrdersServer(filters: OrderFilters) {
  const cookie = (await cookies()).toString();           // async in Next 15+; verify for the pinned version
  const res = await fetch(`${env.API_URL}/orders?${toQuery(filters)}`, { headers: { cookie }, cache: 'no-store' });
  if (!res.ok) throw await toProblemError(res);          // RFC 9457 mapper from src/lib/api
  return ordersResponseSchema.parse(await res.json());   // schema from @scope/contracts
}
```

Public, shareable data may be cached with tags so a mutation can invalidate it:

```ts
const res = await fetch(`${env.API_URL}/products`, { next: { revalidate: 300, tags: ['products'] } });
```

Mutations that change cached public data call `revalidateTag('products')` from the BFF route, in the same step that invalidates the Query keys.

## Per-route files (every route segment that fetches)

| File | Standard |
|---|---|
| `loading.tsx` | Skeleton matching the final layout (no spinners for page-level loading). Shown during navigation and streaming |
| `error.tsx` | Client component. Friendly message, retry (`reset`), report the error id. Never show raw error text |
| `not-found.tsx` | Used with `notFound()` for missing entities |
| `<Suspense>` | Around any slow, independent section; each with its own skeleton |

## Verify the result

`pnpm --filter <app> build` prints each route as static (○), SSG (●) or dynamic (ƒ). Compare against the table above. A public page showing ƒ, or an authenticated page showing ○, is a bug.

## Anti-patterns

- Making an entire layout dynamic by calling `cookies()` high in the tree when only one leaf needs it.
- `export const dynamic = 'force-dynamic'` as a reflex instead of understanding what made the route dynamic.
- Sequential awaits for independent data (`await a; await b`). Use `Promise.all`, or prefetch both in parallel.
- Spinners instead of layout-matching skeletons.
- Shared caching of anything personalized, even "just the profile".
- Hard-coding revalidate numbers without a comment explaining the freshness requirement.
