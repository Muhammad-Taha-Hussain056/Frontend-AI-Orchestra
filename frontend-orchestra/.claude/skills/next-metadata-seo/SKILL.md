---
name: next-metadata-seo
description: Standards for Next.js metadata and SEO - metadata/generateMetadata, title templates, canonical and OpenGraph, sitemap.ts, robots.ts, OG images, JSON-LD structured data, noindex for authenticated areas, hreflang. Use whenever you create a public page or route group, add or change page titles/descriptions/social previews, build sitemaps or robots rules, add structured data, or when a page must not be indexed.
---

# Metadata and SEO

## Rules

1. Every **public** route exports `metadata` or `generateMetadata`. Authenticated route groups set `robots: { index: false, follow: false }` once in their group layout.
2. Root layout defines `metadataBase`, a `title.template`, default description and default OG image. Pages set only what differs.
3. Build metadata through one helper, `buildMetadata()` in `src/lib/seo.ts`, so canonical, OG and Twitter stay consistent. Copy comes from `messages.ts`.
4. `viewport` and `themeColor` use the separate `viewport` export, not `metadata`.
5. `generateMetadata` that fetches data must reuse the page's cached fetch (wrap fetchers in React `cache`) so the request is not duplicated.

```ts
// src/lib/seo.ts
import type { Metadata } from 'next';
import { env } from '@/lib/env';

export function buildMetadata(o: { title: string; description: string; path: string; image?: string; noindex?: boolean }): Metadata {
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },                 // resolved against metadataBase
    openGraph: { title: o.title, description: o.description, url: o.path, type: 'website', images: o.image ? [o.image] : undefined },
    twitter: { card: 'summary_large_image', title: o.title, description: o.description },
    robots: o.noindex ? { index: false, follow: false } : undefined,
  };
}
```

```ts
// src/app/layout.tsx
export const metadata: Metadata = { metadataBase: new URL(env.APP_URL), title: { default: 'Acme', template: '%s | Acme' }, description: '...' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
```

```ts
// src/app/(marketing)/pricing/page.tsx
export const metadata = buildMetadata({ title: pricingMessages.title, description: pricingMessages.description, path: '/pricing' });
```

## Sitemap and robots

```ts
// src/app/sitemap.ts   public, indexable URLs only; large catalogs: generateSitemaps()
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublicProducts();      // cached public fetch with a tag
  return [{ url: `${env.APP_URL}/`, changeFrequency: 'weekly' }, ...products.map((p) => ({ url: `${env.APP_URL}/products/${p.slug}`, lastModified: p.updatedAt }))];
}
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/app/'] }], sitemap: `${env.APP_URL}/sitemap.xml` };
}
```

Non-production environments serve `Disallow: /` and `noindex`.

## Structured data (JSON-LD)

One shared server component; always escape `<`.

```tsx
// src/components/json-ld.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
```

Use schema.org types that match visible content (`Organization`, `Product`, `Article`, `BreadcrumbList`, `FAQPage`). Never mark up content the page does not show.

## OG images

`opengraph-image.tsx` per important route or one default in `app/`. Keep text short and brand colors from tokens.

## i18n (only when `toggles.i18n`)

Add `alternates.languages` (hreflang) and a locale-aware canonical in `buildMetadata`; sitemap lists each locale URL.

## Checklist

- [ ] Public page: unique title, 50-160 character description, canonical, OG image
- [ ] Authenticated group: noindex at the group layout
- [ ] Sitemap lists only indexable URLs; robots disallows `/api/` and app areas
- [ ] JSON-LD matches visible content and is escaped
- [ ] No duplicate fetches between `generateMetadata` and the page
