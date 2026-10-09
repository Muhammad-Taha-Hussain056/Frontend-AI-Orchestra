---
name: next-assets
description: Standards for next/image, next/font and next/script - required props, remote image configuration, font setup with Tailwind variables, third-party script strategies and consent. Use whenever you add an image, avatar, logo, icon file, font, analytics/chat/tag-manager script, video or embed, edit next.config images settings, or investigate layout shift, slow LCP or heavy third-party scripts.
---

# Images, fonts and scripts

## next/image

| Rule | Standard |
|---|---|
| Never raw `<img>` | Use `next/image` for content images. Decorative inline SVG icons use `lucide-react`, not files |
| Size | Always `width` + `height`, or `fill` inside a positioned, sized parent. Prevents layout shift |
| `sizes` | Required with `fill` and responsive images (e.g. `sizes="(min-width: 1024px) 33vw, 100vw"`). Without it the largest image is downloaded |
| `alt` | Required. Informative: describe it. Decorative: `alt=""` |
| `priority` | Only the single likely-LCP image per page. Never lists or below the fold. (Confirm the prop name for the pinned version; it may be renamed in newer releases) |
| Remote images | Allowed only through `images.remotePatterns` with exact `protocol`, `hostname`, `pathname`. No wildcard hosts |
| User uploads | Served from the storage CDN host listed in `remotePatterns`; use the CDN's own resizing loader if configured |
| `unoptimized` | Only for animated GIF/SVG you cannot optimize; comment why |
| Placeholders | `placeholder="blur"` for static imports; supply `blurDataURL` for remote hero images |

```tsx
<Image src={product.imageUrl} alt={product.name} width={640} height={480} sizes="(min-width: 768px) 25vw, 50vw" />
<div className="relative aspect-video"><Image src={hero} alt="" fill sizes="100vw" priority className="object-cover" /></div>
```

## next/font

Fonts are owned by **apps**, never by `packages/ui`. One file defines them.

```ts
// src/lib/fonts.ts
import { Inter, JetBrains_Mono } from 'next/font/google';
export const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
export const fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
```

```tsx
// src/app/layout.tsx
<html lang="en" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
```

Tailwind maps the variables in the shared preset: `fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] }`. Limit weights to those used; always `subsets`; use `next/font/local` for licensed fonts. No `<link>` to Google Fonts.

## next/script

| Script type | Strategy |
|---|---|
| Analytics, tag manager | `afterInteractive`, loaded only after consent when consent is required |
| Chat widgets, social embeds, non-critical | `lazyOnload` |
| Needed before hydration (rare: bot detection, consent manager) | `beforeInteractive`, root layout only |
| Inline snippet | must have an `id` |

Prefer `@next/third-parties` for Google Analytics, Tag Manager and YouTube/Maps embeds. Every third-party script needs an owner and a reason in a comment. Add new hosts to the CSP; with a nonce-based CSP, pass the nonce to scripts.

## Checklist

- [ ] No raw `<img>`; sizes set; one `priority` max
- [ ] `remotePatterns` has exact hosts only
- [ ] Fonts defined once in `src/lib/fonts.ts`, applied via CSS variables, `display: 'swap'`
- [ ] Third-party scripts use the right strategy, are consent-gated when required, and are in the CSP
- [ ] Verified with a production build: no layout shift on images and fonts
