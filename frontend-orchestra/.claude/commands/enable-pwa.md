---
description: Add installability and offline fallback (opt-in PWA)
argument-hint: "<scope: installable | offline-fallback | push>"
---

Enable PWA: $ARGUMENTS

1. Load `x-pwa`, `next-metadata-seo`, `next-rendering-modes`. Verify the current maintained service-worker integration for the pinned Next.js version in its docs before installing anything.
2. Confirm the scope with me (installable only, offline fallback, push). Do not add offline data sync.
3. Implement per the skill: `app/manifest.ts` with icons (including maskable), service worker with the strategy table (never cache authenticated data), offline fallback route, update prompt, kill switch, logout cache clearing.
4. The worker must be disabled in development. Set `toggles.pwa: true` in `orchestra.config.json`.
5. Verify in a production build: installability, offline fallback, update flow, logout clears caches. Report anything that could not be verified.
