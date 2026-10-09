---
description: Retrofit next-intl into the app (routing, messages, switcher, SEO)
argument-hint: "<default-locale> <other-locales...>"
---

Enable i18n: $ARGUMENTS

1. Load `x-i18n`, `next-middleware-auth`, `next-metadata-seo`, `x-dates`. Check the pinned `next` and `next-intl` versions against current docs before writing routing code.
2. Get a plan from `frontend-architect` (routes to move under `app/[locale]`, middleware composition, message namespaces) and **wait for my approval**.
3. Execute: install next-intl with pnpm; add `src/i18n/{routing,request,navigation}.ts`; move routes under `[locale]`; set `<html lang dir>`; compose the next-intl middleware with the auth middleware; add typed message keys.
4. Convert every feature's `messages.ts` into a namespace in `messages/<default-locale>.json`, replace usages with `t()`/`getTranslations`, and convert Zod message literals to keys translated in `FormField`.
5. Update metadata (canonical, hreflang), the sitemap, date/number formatting (locale-aware helpers), and add the language switcher.
6. Set `toggles.i18n: true` in `orchestra.config.json`. Run typecheck, lint, tests and a production build; list any untranslated strings found.
