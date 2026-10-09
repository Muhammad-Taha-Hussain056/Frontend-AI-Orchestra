---
name: x-pwa
description: Progressive Web App standard (opt-in) - when to enable, web app manifest and icons, service worker with a maintained Next.js integration, caching strategies that never cache authenticated data, offline fallback, update flow, push notification notes and verification. Use whenever the user asks for installability, offline support, add-to-home-screen, push notifications or a service worker, or when running /enable-pwa.
---

# PWA (off by default)

`toggles.pwa` is `false` by default. PWA features add operational risk (stale caches, update bugs), so they are enabled only on request via `/enable-pwa`. Never register a service worker "just in case".

Tooling note: use a **maintained** Next.js service worker integration (Serwist is the current successor to next-pwa). Confirm the package, setup and compatibility with the pinned Next.js version in its docs before installing (UNVERIFIED here).

## Scope decision (ask first)

| Goal | Needs |
|---|---|
| Installable (home screen icon, standalone window) | Manifest + icons + HTTPS; service worker optional on some platforms but recommended |
| Offline fallback page | Service worker precaching one offline route |
| Offline data/work | Service worker + client-side persistence + sync strategy: a separate design, not part of this skill's default |
| Push notifications | Service worker + push service + backend subscription endpoints; platform limits apply (notably on iOS, installed apps only) |

## Manifest

`src/app/manifest.ts` (Next metadata file route): `name`, `short_name`, `start_url: '/'`, `scope: '/'`, `display: 'standalone'`, `theme_color`/`background_color` from tokens, icons 192 and 512 px plus a **maskable** icon, `lang`. Add apple touch icon and `viewport` theme color through metadata (`next-metadata-seo`).

## Service worker rules

| Resource | Strategy |
|---|---|
| App shell and static build assets (`/_next/static/*`, fonts, icons) | Precache / cache-first with revision |
| Public images and media | Stale-while-revalidate with size and age limits |
| Navigation requests | Network-first; offline fallback route on failure |
| **Anything personalized: `/api/*`, pages reading the session, `/auth/*`** | **Network-only. Never cache** (golden rule 10) |
| POST/PUT/PATCH/DELETE | Never intercepted, never replayed automatically |

Rules: versioned caches with cleanup of old caches on activate; `skipWaiting` only through the update prompt flow; the worker is disabled in development; scope is `/`.

## Update flow

When a new worker is waiting, show a non-blocking "Update available" prompt (accessible, `role="status"`); on accept, message the worker to skip waiting and reload. Keep a **kill switch**: a way to unregister the worker and clear caches (a `/sw-reset` route or a remote flag) documented in the runbook.

## Auth and privacy

Logout clears caches that could hold user-specific data and unsubscribes push. Do not store tokens in the service worker. Push payloads carry no sensitive content.

## Verification

Lighthouse installability and PWA checks in a **production build**; manual: install, go offline, load fallback, ship an update and confirm the prompt, log out and confirm caches are cleared.

## Anti-patterns

- Caching API responses or HTML for authenticated pages.
- Auto `skipWaiting` that swaps code under an open tab.
- No update path or kill switch.
- Registering the worker in development.
- Promising offline editing without a sync design.
