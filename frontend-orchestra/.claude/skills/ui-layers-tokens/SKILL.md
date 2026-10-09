---
name: ui-layers-tokens
description: UI system standard - the three component layers, packages/ui ownership of shadcn/Radix, semantic design tokens, Tailwind class rules (no raw colors), dark mode with next-themes, cva variants, spacing/radius/typography/z-index scales, responsive rules and icon usage. Use whenever you create or style any component, page layout, button, input, card or dialog, add shadcn components, touch Tailwind config or CSS variables, implement dark mode or theming, or choose colors, spacing or breakpoints.
---

# UI layers and tokens

Version note: Tailwind v4 configures tokens in CSS (`@theme`); v3 uses `tailwind.config`. Read the pinned `tailwindcss` version from session context and follow that version's docs for the token wiring (UNVERIFIED here). The rules below hold for both.

## Layers (each may import only from layers below)

| Layer | Location | Contains |
|---|---|---|
| 1. Primitives | `packages/ui` | shadcn components (copied in, you own them), Radix wrappers, `cn`, tokens, hooks with no domain knowledge |
| 2. Composed | `apps/*/src/components` | App-level compositions (page header, filter bar, empty state) built from layer 1 |
| 3. Feature | `features/<f>/components` | Domain UI. Uses layers 1 and 2 only |

`packages/ui` never imports contracts, features or app code. **Radix and shadcn internals are imported only inside `packages/ui`**; everything else imports from `@scope/ui`.

Adding a shadcn component: use the shadcn CLI through pnpm (`pnpm dlx shadcn@latest add <name>`; confirm the current CLI name/flags in its docs), run from `packages/ui`, then review the generated code against these rules. Never hand-write a component that shadcn provides.

## Tokens

Components use **semantic** tokens only. Raw palette classes (`bg-white`, `text-gray-500`, `border-red-300`) and hex/rgb literals are banned (lint rule in `tool-ts-eslint-prettier`).

| Token | Use |
|---|---|
| `background` / `foreground` | Page surface and default text |
| `card`, `popover` (+ `-foreground`) | Raised surfaces |
| `primary`, `secondary`, `accent` (+ `-foreground`) | Brand actions and emphasis |
| `muted` / `muted-foreground` | Subtle surfaces and secondary text |
| `destructive`, `success`, `warning`, `info` (+ `-foreground`) | Status |
| `border`, `input`, `ring` | Borders, field borders, focus ring |
| `chart-1` ... `chart-5` | Data visualization series |
| `radius` | Base corner radius; sizes derived (`sm`, `md`, `lg`) |

Tokens are CSS variables defined once in `packages/ui` (see `templates/ui/tokens.css`), redefined under `.dark`, and exposed to Tailwind. A new color need means a new **token**, never a one-off class.

## Dark mode

`next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, in the root provider; `<html suppressHydrationWarning>`. A `ThemeToggle` client leaf lives in `packages/ui`. Never branch on theme in JS to pick colors; tokens handle it. Images with baked-in backgrounds need dark variants.

## Component conventions

- Variants with `cva`; class merging with `cn(...)`. No string-built conditional classes.
- Props extend the native element props; forward `className`; `asChild` (Radix `Slot`) for polymorphism. React 19 passes `ref` as a prop; older versions need `forwardRef` (check the pinned React).
- One component per file, kebab-case file, named export, typed props, no default export.
- States are part of the API: default, hover, focus-visible, active, disabled, loading, error. Loading buttons keep their width.
- Touch targets at least 24x24 CSS px (prefer 44 on touch UIs).

## Scales

| Scale | Rule |
|---|---|
| Spacing | Tailwind's default scale only; no arbitrary values (`mt-[13px]`) without a comment |
| Radius | `rounded-sm/md/lg` mapped to the `radius` token; `rounded-full` for avatars/pills |
| Type | `text-xs/sm/base/lg/xl/2xl...` with semantic headings via `<h1>`-`<h6>`; never pick heading level for size |
| Z-index | Named layers (`dropdown`, `sticky`, `overlay`, `modal`, `toast`) in the preset; no raw `z-[999]` |
| Breakpoints | Mobile-first (`sm`, `md`, `lg`, `xl`); design the 320px layout first |

## Responsive

Mobile-first utilities; container queries (`@container`) for components reused in different widths; no horizontal page scroll at 320px; tables scroll in their own container; test at 320, 768, 1280.

## Icons

`lucide-react`, named imports (`import { Check } from 'lucide-react'`), size via `size-4/5/6`, color via `text-*` tokens. Icon-only buttons need `aria-label`; decorative icons `aria-hidden`.

## Anti-patterns

- Importing `@radix-ui/*` from an app or feature.
- `bg-white dark:bg-zinc-900` pairs instead of `bg-background`.
- Per-feature copies of button/card/input.
- Arbitrary values and inline `style` colors.
- Changing a shared primitive for one feature's need (add a variant or compose in layer 2/3).
