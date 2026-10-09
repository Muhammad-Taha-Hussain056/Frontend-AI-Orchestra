---
name: data-tanstack-query
description: The standard for TanStack Query - QueryClient setup for server and browser, query key factories and queryOptions, staleTime tiers, when to cache, invalidate, refetch or remove, server prefetch and hydration, pagination and infinite lists, optimistic updates, retries, window-focus rules and global error handling. Use whenever you read server data in a component, write or change a useQuery/useInfiniteQuery/useSuspenseQuery, create query keys, prefetch in a Server Component, tune caching or refetching, or debug stale or flickering data.
---

# TanStack Query standard

Version note: written for TanStack Query v5 (`gcTime`, `isPending`, `HydrationBoundary`, `queryOptions`, required `initialPageParam`). Read the pinned version from session context; if it is not v5, stop and ask.

Server data lives **only** here. Never copy it into Zustand, Redux or `useState`.

## QueryClient

```ts
// src/lib/providers/query-client.ts
import { isServer, QueryClient } from '@tanstack/react-query';
import { STALE } from '@/lib/queries/stale-times';
import { ProblemError } from '@/lib/api/problem';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE.standard,              // > 0 so hydrated data is not refetched immediately
        retry: (count, err) => !(err instanceof ProblemError && err.status < 500 && ![408, 429].includes(err.status)) && count < 2,
        refetchOnWindowFocus: true,             // turn off per query for edit forms (see rules)
      },
      mutations: { retry: 0 },
    },
  });
}
let browserClient: QueryClient | undefined;
export function getQueryClient() {
  if (isServer) return makeQueryClient();       // new per call on the server
  return (browserClient ??= makeQueryClient()); // singleton in the browser
}
```

On the server, wrap in React's `cache` where several components in one request must share a client: `export const getServerQueryClient = cache(makeQueryClient)`.

## staleTime tiers (single source)

```ts
// src/lib/queries/stale-times.ts
export const STALE = { static: 60 * 60_000, standard: 60_000, live: 0 } as const;
```

| Data | Tier | Extras |
|---|---|---|
| Reference data (countries, plans, enums) | `static` (1 h) | `gcTime` default |
| Normal entities and lists | `standard` (60 s) | |
| Live data (counts, status, notifications) | `live` (0) | `refetchInterval` or SSE/WebSocket-driven invalidation |
| Data inside an edit form | `standard` or higher | `refetchOnWindowFocus: false` so a refetch never resets the form |

`gcTime` stays at the 5-minute default unless a screen needs instant back-navigation, then raise it for that query only.

## Key factories and `queryOptions`

One factory per entity, in the feature (`features/<f>/api/keys.ts`) or `src/lib/queries/<entity>.ts` when shared. Never inline key arrays.

```ts
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (f: OrderFilters) => [...orderKeys.lists(), f] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export const orderListOptions = (f: OrderFilters) =>
  queryOptions({ queryKey: orderKeys.list(f), queryFn: () => fetchOrders(f), staleTime: STALE.standard });
```

Filters in keys are plain serializable objects with a stable shape (parse and default them first). The server prefetch reuses the same options and overrides only `queryFn`:

```ts
await qc.prefetchQuery({ ...orderListOptions(filters), queryFn: () => getOrdersServer(filters) });
```

## What to do when data may be out of date

| Situation | Action |
|---|---|
| You created/updated/deleted something | `invalidateQueries` on the **narrowest** key (`orderKeys.lists()`, plus `orderKeys.detail(id)`) |
| The mutation response contains the full updated entity | `setQueryData(orderKeys.detail(id), data)` **and** invalidate lists |
| Data should be fresh when the user returns to the tab | Leave `refetchOnWindowFocus` on (lists, dashboards) |
| Edit form is open | `refetchOnWindowFocus: false`; compare on submit via version/ETag if the backend supports it |
| User logs out or switches account | `queryClient.clear()` |
| Entity deleted | `removeQueries({ queryKey: orderKeys.detail(id) })` then invalidate lists |
| Live feed | SSE/WebSocket event handler calls `invalidateQueries` or `setQueryData`; never keep a parallel store |
| Public cached data (Next cache tags) | Also covered by the BFF via `data-bff-proxy`; invalidate both sides |

Do not call `refetch()` for "after mutation" cases; invalidate instead. Do not invalidate the entire cache.

## Server prefetch and hydration

Prefetch only what is above the fold and needed for first paint; leave the rest to client queries behind skeletons. See the full page example in `next-server-vs-client` (Pattern 1). Always `staleTime > 0` on prefetched queries. Streaming pending queries needs the dehydrate option from the official docs for the pinned version (UNVERIFIED here); do not guess it.

## Lists, pagination, infinite scroll

- Filters, sort and page live in the **URL** (search params), parsed with Zod; the key includes them; the server prefetch uses the same parsed filters.
- Paginated lists: `placeholderData: keepPreviousData` to avoid flicker between pages.
- Infinite lists: `useInfiniteQuery` with `initialPageParam` and `getNextPageParam`; cursor-based API pagination, not offset.
- Large tables: server-side pagination/sort/filter. Virtualize only when hundreds of rows render (see UI skills).

## Optimistic updates (only for low-risk toggles: like, archive, reorder)

```ts
useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: orderKeys.detail(id) });
    const previous = qc.getQueryData(orderKeys.detail(id));
    qc.setQueryData(orderKeys.detail(id), (old) => old && { ...old, favorite: !old.favorite });
    return { previous };
  },
  onError: (_e, id, ctx) => ctx && qc.setQueryData(orderKeys.detail(id), ctx.previous),
  onSettled: (_d, _e, id) => qc.invalidateQueries({ queryKey: orderKeys.detail(id) }),
});
```

Never optimistic for payments, creates that need server IDs, or anything with side effects.

## Hooks, errors and loading

- Wrap each query in a feature hook (`useOrders(filters)`); components never build query options inline.
- Fetchers validate responses with the schema from `@scope/contracts` and throw `ProblemError` (see `form-error-mapping`).
- Global side effects (401 → refresh, 403 → permission toast, 5xx → toast with trace id) live in `QueryCache`/`MutationCache` `onError`; a query that handles its own error sets `meta: { silent: true }`.
- Loading: skeletons that match the layout. `isPending` for first load, `isFetching` for background refresh indicators.
- `enabled` for dependent queries; never to hide missing parameters.

## Anti-patterns

- Inline `['orders', id]` keys; keys that differ between server prefetch and client.
- `staleTime: 0` on prefetched data (immediate double fetch).
- Mirroring query results into state or a store.
- `invalidateQueries()` with no key; `refetch()` after a mutation.
- Fetching in `useEffect`; creating a `QueryClient` inside a component body.
- Setting `refetchOnWindowFocus: false` globally to hide a stale-data bug.
- Using Query for client-only UI state.
