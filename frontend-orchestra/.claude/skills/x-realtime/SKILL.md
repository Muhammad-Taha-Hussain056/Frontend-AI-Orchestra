---
name: x-realtime
description: Real-time standard - choosing polling vs SSE vs WebSocket, authenticating the connection to the NestJS gateway, one shared connection provider, schema-validated events, bridging events into the TanStack Query cache, reconnection and cleanup. Use whenever you add live updates, notifications, progress streams, presence, chat, collaborative features or any push from the server, or when live data causes duplicate state or leaked connections.
---

# Real-time

Toggle: `toggles.realtime` is `none`, `sse` or `websocket`.

## Choose by need

| Need | Mechanism |
|---|---|
| Simple freshness (status that changes every few seconds/minutes) | **Polling** with TanStack Query `refetchInterval` (pause when hidden) |
| One-way server → client push (notifications, job progress, live feed) | **SSE** (`EventSource`) |
| Bidirectional, low latency (chat, collaboration, presence, typing) | **WebSocket** via Socket.IO (matches a NestJS gateway) |

Pick the simplest that works. Never run two mechanisms for the same data.

## Connection and auth (documented exception to the BFF rule)

The BFF cannot proxy long-lived sockets well, so the browser connects to the NestJS gateway **directly**. Authenticate by one of:

1. **Shared parent domain cookies** (app and API on the same site, e.g. `app.example.com` and `api.example.com`, cookie `Domain=.example.com`, `SameSite=Lax`, `Secure`), or
2. **Connection ticket (preferred when domains differ):** `POST /api/realtime/ticket` through the BFF returns a short-lived, single-use ticket from NestJS; pass it on connect. Tickets are validated server-side and expire in seconds.

Never put access tokens in URLs or JavaScript-readable storage. Record which option the project uses in `orchestra.config.json`.

## Architecture

- **One** connection per tab, owned by `RealtimeProvider` (`src/lib/providers/`), created after login and closed on logout/unmount. Features subscribe through a hook; they never open their own connections.
- Events are typed with a Zod discriminated union in `@scope/contracts` (`realtimeEventSchema`); every incoming message is parsed; invalid ones are dropped and logged.
- **Events update the Query cache; they are never stored in a parallel store.**

```ts
// features/orders/hooks/use-orders-realtime.ts
export function useOrdersRealtime() {
  const qc = useQueryClient();
  useRealtimeEvent('order.updated', (e) => {
    qc.setQueryData(orderKeys.detail(e.orderId), (old) => (old ? { ...old, ...e.patch } : old));
    scheduleInvalidate(qc, orderKeys.lists());                 // batched, see below
  });
}
```

- Batch invalidations (coalesce within about 250 ms) so event bursts do not trigger refetch storms.
- Ephemeral signals (typing, presence, cursors) are client state (Zustand), not Query data.
- Subscribe only while the relevant screen is mounted; unsubscribe in cleanup.

## Reliability

Automatic reconnect with exponential backoff and jitter; SSE sends `Last-Event-ID` and the server resumes; after reconnect, **invalidate the affected queries** (events may have been missed); pause on `visibilitychange` hidden when appropriate; show a subtle offline/reconnecting indicator for critical screens.

## Testing

Mock the connection layer with a small fake emitter in tests; assert cache updates, not socket internals. E2E covers one happy path.

## Anti-patterns

- A socket per component; connections not closed on logout.
- Copying event payloads into Redux/Zustand for server entities.
- Trusting event payloads without parsing; applying patches to missing cache entries blindly.
- Polling and push for the same resource.
- Tokens in query strings.
