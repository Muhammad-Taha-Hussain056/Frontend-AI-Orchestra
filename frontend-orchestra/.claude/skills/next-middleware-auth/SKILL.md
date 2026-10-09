---
name: next-middleware-auth
description: Standard for Next.js middleware and authentication - the three auth layers (optimistic middleware, server data layer, UI), httpOnly-cookie sessions issued by NestJS, getSession/requireUser, token refresh and 401 handling, login/logout flow, safe redirects, plus locale and A/B routing in middleware. Use whenever you add or change middleware.ts (or proxy.ts), protect a route, read the current user in a Server Component, build login/logout, handle expired sessions or 401s, or add locale or experiment routing.
---

# Middleware and auth

Version note: the file is `middleware.ts` in Next 14/15. Newer versions may rename it (reported as `proxy.ts` in Next 16; UNVERIFIED, check the pinned version's docs).

## Auth model

NestJS issues access and refresh tokens as `httpOnly; Secure; SameSite=Lax` cookies. Browser JavaScript never sees tokens, and no auth library runs on the frontend. Cookie names and auth endpoints come from `orchestra.config.json` (`backend.authCookies`, `backend.authPaths`).

## Three layers, three jobs

| Layer | Job | Never |
|---|---|---|
| Middleware | **Optimistic** redirect: cookie present and not expired, else go to login or refresh | Authorize, call the API, query anything |
| Data layer (`src/lib/auth/session.ts`) | **Real** check: `getSession()` calls NestJS `/auth/me`; `requireUser()` / `requirePermission()` gate every protected page, layout data call and server function | Be skipped because middleware "already checked" |
| UI | Show/hide by permission (`can()`) for convenience | Be treated as security |

Middleware alone is never a security boundary: a 2025 middleware-bypass vulnerability in Next.js is the reason. Every protected Server Component and BFF route re-checks.

## Middleware template

```ts
// src/middleware.ts   (keep it small: edge runtime, no Node APIs, no network calls)
import { NextResponse, type NextRequest } from 'next/server';
import { isPublicRoute, routes } from '@/lib/routes';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { isAccessTokenFresh } from '@/lib/auth/token-expiry';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname + search);                       // lets server code build a return URL

  if (isPublicRoute(pathname)) return NextResponse.next({ request: { headers } });

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access && isAccessTokenFresh(access)) return NextResponse.next({ request: { headers } });

  const next = encodeURIComponent(pathname + search);
  if (req.cookies.has(REFRESH_COOKIE)) return NextResponse.redirect(new URL(`/api/auth/refresh?next=${next}`, req.url));
  return NextResponse.redirect(new URL(`${routes.login}?next=${next}`, req.url));
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'] };
```

```ts
// src/lib/auth/token-expiry.ts   expiry HINT only (no signature check; the backend is the authority)
export function isAccessTokenFresh(token: string, skewSeconds = 30): boolean {
  try {
    const payload = token.split('.')[1] ?? '';
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof exp === 'number' && exp - skewSeconds > Date.now() / 1000;
  } catch { return false; }
}
```

## Session helpers (server data layer)

```ts
// src/lib/auth/session.ts
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { sessionSchema } from '@scope/contracts';
import { serverFetch } from '@/lib/api/server';

export const getSession = cache(async () => {                  // one call per request, however many components ask
  const res = await serverFetch('/auth/me', { allow401: true });
  return res.status === 401 ? null : sessionSchema.parse(await res.json());
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect(await loginUrlWithReturn());           // reads x-pathname header
  return session;
}
```

Server Components cannot set cookies, so they cannot refresh tokens. Refresh happens only in: the middleware redirect to `/api/auth/refresh`, and the BFF proxy's 401 retry (`data-bff-proxy`). `serverFetch` that receives a 401 redirects to the refresh route once. **Loop guard:** the refresh route returns to the page with a `_r=1` marker; a second 401 with the marker goes to login.

## Refresh route and safe redirects

```ts
// src/app/api/auth/refresh/route.ts   GET: refresh, then return to the page (or login)
export async function GET(req: NextRequest) {
  const next = safeRedirectPath(req.nextUrl.searchParams.get('next'));
  const refreshed = await refreshSession(req.headers.get('cookie') ?? '');   // single-flight, see data-bff-proxy
  if (!refreshed) return NextResponse.redirect(new URL(`${routes.login}?next=${encodeURIComponent(next)}`, req.url));
  const res = NextResponse.redirect(new URL(addMarker(next, '_r', '1'), req.url));
  refreshed.setCookies.forEach((c) => res.headers.append('set-cookie', c));
  return res;
}

// src/lib/auth/safe-redirect.ts   prevents open redirects through ?next=
export function safeRedirectPath(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
```

## Login and logout

- Login form posts to `/api/auth/login` through the BFF; NestJS sets the cookies on its response and the proxy passes `Set-Cookie` through. On success: `router.replace(safeRedirectPath(next))`.
- Logout: `POST /api/auth/logout`, then `queryClient.clear()`, reset every user-specific Zustand store (`resetAllStores()` from `src/lib/stores`), `router.replace(routes.login)`.
- Required backend behavior: cookies set without a `Domain` that excludes the app's origin, `Secure` in production, `SameSite=Lax` or stricter.

## Public and auth route lists

`src/lib/routes.ts` exports `routes` (builders), `publicRoutes` (marketing, docs) and `authRoutes` (login, register). `isPublicRoute(pathname)` is the only place those lists are consulted. Logged-in users hitting `authRoutes` are redirected to the app home by the page (data layer), not middleware.

## Locale routing (only when `toggles.i18n` is true)

Run the `next-intl` middleware first, then the auth check against the locale-stripped path; routes live under `app/[locale]/`. Use `/enable-i18n` rather than hand-wiring.

## A/B experiments

Typed registry in `src/lib/experiments.ts` (name, variants, owner, end date). Middleware assigns a variant cookie (`ab_<name>`, random via `crypto.getRandomValues`) when absent and rewrites to the variant route. No personal data in the cookie; flags stay typed env-based (`toggles.featureFlags`) until a flag service is chosen. Remove experiments after the end date.

## Anti-patterns

- Authorization decisions in middleware, or API calls from it.
- Trusting `x-pathname` or `next` without validation.
- Storing tokens in `localStorage` or reading them in client code.
- Calling `/auth/me` from many components without the `cache` wrapper.
- Caching `/auth/me` or any session response in a shared cache.
- Refresh logic duplicated in several places instead of `refreshSession`.
