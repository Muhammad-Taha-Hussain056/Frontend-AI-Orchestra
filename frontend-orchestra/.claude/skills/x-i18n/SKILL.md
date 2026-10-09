---
name: x-i18n
description: Internationalization standard with next-intl - when it is enabled, routing and middleware, message files namespaced per feature, typed keys, server and client usage, plurals and formatting, translating Zod and server errors, metadata and hreflang, RTL, and the retrofit path from per-feature messages.ts. Use whenever toggles.i18n is true, when adding any user-facing text or locale, when running /enable-i18n, or when formatting dates, numbers or currency for a locale.
---

# i18n (next-intl, per-project toggle)

i18n is **off by default** (`toggles.i18n: false`). When off, user-facing copy lives in per-feature `messages.ts` so the retrofit is mechanical. Enable with `/enable-i18n`; never hand-wire it.

Version note: next-intl's routing/navigation API changed across majors (`defineRouting`, `createNavigation`). Follow the docs for the pinned version (UNVERIFIED here).

## Structure when enabled

```
src/
├── i18n/
│   ├── routing.ts        # locales, defaultLocale, localePrefix
│   ├── request.ts        # getRequestConfig: loads messages for the request locale
│   └── navigation.ts     # locale-aware Link, redirect, usePathname, useRouter
├── messages/
│   ├── en.json           # namespaced per feature: { "orders": { "title": "..." } }
│   └── <locale>.json
└── app/[locale]/...      # every route lives under the locale segment
```

## Rules

1. **Namespace per feature** (`orders.*`, `common.*`). Keys are semantic (`orders.empty.title`), never the English text.
2. Server: `getTranslations('orders')`. Client: `useTranslations('orders')`. Pass strings from server to client as props when a client component only displays them, to keep client bundles small.
3. Typed keys through a global message type declaration derived from `en.json` (default locale is the source of truth); missing keys fail typecheck.
4. ICU syntax for plurals/select (`{count, plural, one {# order} other {# orders}}`); never concatenate fragments or build sentences from parts.
5. Formatting via next-intl's formatter (`useFormatter`/`getFormatter`) or shared date helpers with the active locale (`x-dates`). No `toLocaleString` scattered in components.
6. Navigation uses the locale-aware `Link`/`redirect` from `src/i18n/navigation.ts`, never `next/link` directly.
7. Static rendering: call `setRequestLocale(locale)` in layouts/pages and provide `generateStaticParams` for locales (per the docs for the pinned version).
8. `<html lang={locale} dir={dir}>`; RTL locales set `dir="rtl"`; use logical Tailwind utilities (`ms-*`, `ps-*`, `text-start`) instead of left/right.
9. Locale detection happens in middleware (`next-middleware-auth`); the user's explicit choice is stored in a cookie and wins over `Accept-Language`.

## Zod and server messages

- Schema messages are **keys**, not sentences: `z.string().min(1, 'orders.form.nameRequired')`. `FormField` translates the message when it is a key.
- Backend `errors` messages: until the backend localizes or sends codes, show them as received; prefer `code` → translated message (`form-error-mapping`).
- Never translate by matching English strings.

## Retrofit from `messages.ts`

`/enable-i18n` performs: install and configure next-intl; move routes under `[locale]`; convert each feature's `messages.ts` to a namespace in `en.json`; replace usages with `t('...')`; update metadata (`next-metadata-seo` hreflang); add the language switcher; update the middleware composition.

## SEO

Each locale has its own URL, canonical, and `alternates.languages`; sitemap lists all locales; `x-default` points to the default locale.

## Anti-patterns

- Hard-coded strings in JSX once i18n is on.
- Keys that are the English text; concatenated translated fragments.
- Hard-coded `en-US` formats; `left`/`right` utilities in RTL-capable UI.
- Importing `next/link` or `next/navigation` redirect in localized routes.
- Loading every locale's messages on the client.
