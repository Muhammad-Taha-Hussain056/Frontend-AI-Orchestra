---
name: data-bff-proxy
description: The Backend-for-Frontend layer - the catch-all /api proxy route to NestJS, the browser apiFetch client, the server serverFetch client, cookie and header forwarding, CSRF checks, single-flight token refresh, Next cache-tag invalidation after mutations, and the RFC 9457 error mapping. Use whenever you add or change code that calls the backend, create fetchers, edit src/app/api, handle 401/403/5xx from NestJS, forward cookies, or wire cache tag invalidation. Also use when the browser appears to call NestJS directly.
---

# BFF proxy

```
Server Component  → serverFetch  → NestJS                (direct, user's cookie forwarded)
Browser (read/write) → apiFetch → /api/[...path] (BFF) → NestJS
SSE / WebSocket   → NestJS gateway directly (documented exception; cookie auth)
```

The browser never calls NestJS directly for requests. One proxy replaces per-endpoint handlers, so adding an endpoint needs no BFF code.

## The proxy route

```ts
// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { refreshSession } from '@/lib/auth/refresh';
import { applyCacheTags } from '@/lib/api/cache-tags';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORWARD_REQ = ['accept', 'accept-language', 'content-type', 'cookie', 'idempotency-key', 'if-match', 'if-none-match', 'user-agent'];
const DROP_RES = new Set(['connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'content-encoding', 'content-length', 'set-cookie']);

const problem = (status: number, title: string) =>
  NextResponse.json({ type: 'about:blank', title, status }, { status, headers: { 'content-type': 'application/problem+json' } });

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;                                  // Next 15+: params is a Promise
  if (path.some((s) => !s || s === '.' || s === '..' || /[\\/]/.test(s))) return problem(400, 'Invalid path');

  if (!SAFE.has(req.method)) {                                         // CSRF defense on top of SameSite cookies
    const site = req.headers.get('sec-fetch-site');
    const sameOrigin = site ? site === 'same-origin' : req.headers.get('origin') === new URL(env.APP_URL).origin;
    if (!sameOrigin) return problem(403, 'Cross-site request blocked');
  }

  const headers = new Headers();
  for (const h of FORWARD_REQ) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  headers.set('x-request-id', req.headers.get('x-request-id') ?? crypto.randomUUID());

  const url = `${env.API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const body = SAFE.has(req.method) ? undefined : await req.arrayBuffer();   // large files use presigned uploads, never this route
  const send = (h: Headers) => fetch(url, { method: req.method, headers: h, body, redirect: 'manual', cache: 'no-store' });

  let upstream = await send(headers);
  const setCookies: string[] = [];

  if (upstream.status === 401 && headers.get('cookie')) {              // one refresh + one retry
    const refreshed = await refreshSession(headers.get('cookie')!);
    if (refreshed) {
      setCookies.push(...refreshed.setCookies);
      headers.set('cookie', refreshed.cookieHeader);
      upstream = await send(headers);
    }
  }
  setCookies.push(...upstream.headers.getSetCookie());

  if (!SAFE.has(req.method) && upstream.ok) await applyCacheTags(req.method, path.join('/'));

  const out = new Headers();
  upstream.headers.forEach((v, k) => { if (!DROP_RES.has(k.toLowerCase())) out.set(k, v); });
  setCookies.forEach((c) => out.append('set-cookie', c));
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
```

## Single-flight refresh (prevents rotation logouts)

Parallel requests that all hit 401 must trigger **one** refresh, or refresh-token rotation logs the user out.

```ts
// src/lib/auth/refresh.ts
import 'server-only';
const inFlight = new Map<string, Promise<RefreshResult | null>>();
export type RefreshResult = { setCookies: string[]; cookieHeader: string };

export function refreshSession(cookieHeader: string) {
  const key = refreshCookieValue(cookieHeader);                // key by the refresh token value
  const existing = inFlight.get(key); if (existing) return existing;
  const p = doRefresh(cookieHeader).finally(() => setTimeout(() => inFlight.delete(key), 5_000)); // short grace for late arrivals
  inFlight.set(key, p); return p;
}
```

This only de-duplicates within one server instance. The backend should also accept a just-rotated refresh token for a few seconds (grace window). Ask the backend team; record the answer in `orchestra.config.json`.

## Browser client (`src/lib/api/client.ts`)

```ts
export async function apiFetch<T>(path: string, opts: { method?: string; body?: unknown; schema: ZodType<T>; signal?: AbortSignal; idempotencyKey?: string }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'same-origin',
    headers: { accept: 'application/json', ...(opts.body ? { 'content-type': 'application/json' } : {}), ...(opts.idempotencyKey ? { 'idempotency-key': opts.idempotencyKey } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) throw await ProblemError.fromResponse(res);     // parses RFC 9457, never leaks raw HTML
  return res.status === 204 ? (undefined as T) : opts.schema.parse(await res.json());
}
```

## Server client (`src/lib/api/server.ts`)

`import 'server-only'`. Reads the cookie with `await cookies()`, calls `env.API_URL` directly, defaults to `cache: 'no-store'`, forwards `x-request-id`. On 401 (unless `allow401`) it redirects to `/api/auth/refresh?next=<x-pathname>` (see `next-middleware-auth`). Public, cacheable fetches pass `next: { revalidate, tags }` explicitly and never forward the cookie.

## Cache tags after mutations

Next's data cache only holds **public** data (see `next-rendering-modes`). One central file maps mutations to tags:

```ts
// src/lib/api/cache-tags.ts
const RULES = [{ methods: ['POST', 'PUT', 'PATCH', 'DELETE'], match: /^products(\/|$)/, tags: ['products'] }];
export async function applyCacheTags(method: string, path: string) {
  for (const r of RULES) if (r.methods.includes(method) && r.match.test(path)) r.tags.forEach((t) => revalidateTag(t));
}
```

`revalidateTag`'s signature differs across Next versions; follow `next-rendering-modes/references/by-version.md`. Query keys are invalidated separately by the mutation hook (`data-mutations`).

## Errors

All failures reach the UI as `ProblemError` (RFC 9457; schema in `@scope/contracts`; mapping rules in `form-error-mapping`). The proxy returns `application/problem+json` for its own failures.

## Cookies and headers contract

- Backend cookies must have no `Domain` that excludes the app origin, `Secure` in production, `HttpOnly`, `SameSite=Lax` or stricter.
- Forward only the allowlisted request headers; never forward `host`, `x-forwarded-*` from the client, or an `authorization` header.
- The backend's CORS stays closed to browsers; only the Next server calls it.

## Anti-patterns

- `fetch('https://api...')` in client code, or `NEXT_PUBLIC_API_URL` pointing at NestJS.
- One handler file per endpoint in `app/api/`.
- Forwarding all incoming headers, or reflecting `Origin`.
- Parsing responses without the contract schema; swallowing non-2xx as empty data.
- Caching any response that depended on the user's cookie.
- Refresh logic outside `refreshSession`.
