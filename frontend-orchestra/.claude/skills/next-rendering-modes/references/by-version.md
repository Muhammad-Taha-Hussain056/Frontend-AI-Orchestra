# Next.js caching and request APIs by version

Status legend: **VERIFIED** = matches documentation the author confirmed. **UNVERIFIED** = written from memory; confirm in the official docs for the pinned version before relying on it.
This file is completed during the verification pass (see the roadmap). Do not extend it from memory.

## Contents
- Next.js 15
- Next.js 16
- Next.js 14 and earlier

## Next.js 15 (UNVERIFIED, confirm before use)
- `cookies()`, `headers()`, `params`, `searchParams` are asynchronous (await them).
- `fetch` requests are not cached by default; opt in with `cache: 'force-cache'` or `next: { revalidate, tags }`.
- GET route handlers are not cached by default.
- Route segment config: `export const dynamic`, `export const revalidate`; `generateStaticParams` for static dynamic-segment pages.
- `revalidateTag(tag)` and `revalidatePath(path)` invalidate cached data.
- `unstable_cache` for caching non-fetch work.

## Next.js 16 (UNVERIFIED, confirm before use)
- Cache Components model: opt-in via config, `'use cache'` directive, `cacheLife`, `cacheTag`. PPR folds into this model.
- Cache invalidation helpers may have changed signatures (for example `revalidateTag` taking a cache-life profile argument, and new helpers for read-your-writes). Confirm exact names and signatures in the docs.
- Request APIs remain asynchronous.

## Next.js 14 and earlier (UNVERIFIED)
- `fetch` is cached by default (opposite of 15). `cookies()`/`headers()` are synchronous. Treat as legacy; prefer upgrading.

## When the pinned version is not listed
Open the official Next.js docs for that exact version, record the findings here with VERIFIED status, then proceed.
