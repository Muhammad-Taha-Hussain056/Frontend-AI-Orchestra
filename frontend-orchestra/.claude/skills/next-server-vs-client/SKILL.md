---
name: next-server-vs-client
description: Standard for choosing Server vs Client Components in the Next.js App Router - when 'use client' is allowed, where the boundary goes, how to pass data and children across it, providers, client-only libraries, and the server-prefetch + hydrate pattern. Use whenever you create or edit a page, layout or component, add 'use client' or 'server-only', use hooks (useState, useEffect, useQuery, useForm), browser APIs, context providers, or dynamic imports. Trigger even if the user does not mention server or client components.
---

# Server vs Client Components

**Default: Server Component.** Add `'use client'` only when the file needs it, on the smallest leaf that does.

## Decision table

| The code needs... | Component type |
|---|---|
| Nothing interactive; renders data, markup, layout | **Server** (default) |
| `onClick`/`onChange`, `useState`, `useReducer`, `useEffect`, refs to DOM | **Client** (leaf) |
| Browser APIs (`window`, `localStorage`, `IntersectionObserver`) | **Client** |
| TanStack Query hooks, React Hook Form, Zustand/Redux hooks, Framer Motion, context consumers | **Client** |
| Secrets, server tokens, cookies/headers, direct NestJS calls | **Server only** (`import 'server-only'`) |
| Large dependency used for display only (markdown, syntax highlight) | **Server** (keeps it out of the client bundle) |
| Interactive widget inside a data-heavy page | Server page renders data, passes it to a small client island |

## Boundary rules

1. `'use client'` marks a **boundary**: that file and everything it imports becomes client code. Keep the imported subtree small.
2. Never put `'use client'` in a `page`, `layout`, `loading`, `error` (exception: `error.tsx` and `global-error.tsx` must be client components), a barrel `index.ts`, or a file that only composes children.
3. Server → client props must be **serializable**: strings, numbers, booleans, plain objects/arrays, ISO date strings. No functions, class instances, `Date`, `Map`/`Set`, JSX-returning render props from server to client.
4. A client component can render **server-rendered children** passed in as `children` or other props. Importing a server component inside a client file converts it to client; passing it as a prop does not.
5. Server-only code starts with `import 'server-only'`; code that must never run on the server starts with `import 'client-only'`.
6. Do not fetch in `useEffect`. Initial data is prefetched on the server; later reads use TanStack Query.

## Pattern 1: server prefetch + client island (the standard for authenticated pages)

```tsx
// src/app/(app)/orders/page.tsx   SERVER component. No 'use client'.
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { OrdersTable } from '@/features/orders';
import { orderKeys, getOrdersServer, parseOrderFilters } from '@/features/orders/server';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Next 15+: searchParams/params/cookies()/headers() are async. Verify against the pinned version.
  const filters = parseOrderFilters(await searchParams);

  const queryClient = new QueryClient();            // new per request, never module-scoped on the server
  await queryClient.prefetchQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrdersServer(filters),        // calls NestJS directly with the user's cookie
    staleTime: 60_000,                              // > 0 or the client refetches immediately after hydration
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersTable filters={filters} />             {/* client component reads the same key via useQuery */}
    </HydrationBoundary>
  );
}
```

```tsx
// src/features/orders/components/orders-table.tsx   CLIENT leaf
'use client';
import { useQuery } from '@tanstack/react-query';
import { orderKeys } from '../api/keys';
import { fetchOrders } from '../api/fetchers'; // browser path: BFF proxy, never NestJS directly

export function OrdersTable({ filters }: { filters: OrderFilters }) {
  const { data } = useQuery({ queryKey: orderKeys.list(filters), queryFn: () => fetchOrders(filters), staleTime: 60_000 });
  // ...interactive table
}
```

Server and client use the **same query key factory**. Full Query rules live in the TanStack Query skill (added in a later batch); until then keep to the example above.

## Pattern 2: interactive wrapper around server content

```tsx
// ui/collapsible-section.tsx  CLIENT: only the toggle is interactive
'use client';
export function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (<section><button onClick={() => setOpen(!open)}>{title}</button>{open && children}</section>);
}

// page.tsx  SERVER: heavy content stays server-rendered and is passed as children
<CollapsibleSection title="History"><OrderHistory orderId={id} /></CollapsibleSection>
```

## Pattern 3: providers

Each provider is its own small client file in `src/lib/providers/`, composed in a `providers.tsx` client component, mounted once in the root `layout.tsx`. `children` passed through stay server components.

```tsx
// src/lib/providers/providers.tsx
'use client';
export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider><ThemeProvider>{children}</ThemeProvider></QueryProvider>;
}
// src/app/layout.tsx (server): <Providers>{children}</Providers>
```

## Pattern 4: client-only third-party libraries (editors, charts, maps)

Wrap in a client file and lazy-load. `ssr: false` is only allowed inside a Client Component.

```tsx
'use client';
import dynamic from 'next/dynamic';
const RevenueChart = dynamic(() => import('./revenue-chart'), { ssr: false, loading: () => <ChartSkeleton /> });
```

## Anti-patterns

| Wrong | Right |
|---|---|
| `'use client'` at the top of `page.tsx` to use one hook | Extract the interactive part into a leaf client component |
| `useEffect(() => fetch(...))` for initial data | Server prefetch + `HydrationBoundary` |
| Importing a `server-only` module into a client file | Pass the data as props, or fetch through the BFF in a query |
| Module-level `new QueryClient()` on the server | New client per request |
| Passing `new Date()`, functions or class instances as props to client | ISO strings and plain data |
| `'use client'` in `index.ts` | Directive on each file that needs it |
| Reading `window` during render | Guard in an effect, or make it a client leaf |
| Marking a whole layout client for a theme toggle | Client `ThemeToggle` leaf inside a server layout |

## Checklist before finishing

- [ ] Every `'use client'` file is a leaf with a real reason (state, effect, handler, browser API, client-only hook)
- [ ] No server-only import reachable from a client file
- [ ] Props crossing the boundary are serializable
- [ ] Prefetch and `useQuery` share one key factory, and `staleTime` > 0
- [ ] Heavy display-only dependencies stay on the server
