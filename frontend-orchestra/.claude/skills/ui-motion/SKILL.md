---
name: ui-motion
description: Motion standard - CSS transitions first, Framer Motion (Motion) only in client leaves, lazy feature bundles, duration/easing tokens, reduced-motion support, what to animate and what never to animate. Use whenever you add animation, transitions, page or list enter/exit effects, skeleton shimmer, gestures or layout animation, or when animation causes jank, layout shift or accessibility issues.
---

# Motion

Package note: Framer Motion is now published as `motion` (import path `motion/react`); older projects use `framer-motion`. Use whichever the repo already installs; verify the import path for the pinned version (UNVERIFIED here).

## Order of preference

1. **CSS transitions/animations** via Tailwind utilities (`transition`, `duration-150`, `ease-out`, `data-[state=open]:animate-in`) for hover, focus, expand, fade. Radix/shadcn components already animate with `data-state`.
2. **Motion library** only for: mount/unmount (`AnimatePresence`), gestures (drag, swipe), shared-element/layout transitions, orchestrated sequences, spring physics.
3. Nothing else (no GSAP/Lottie without approval).

## Rules

| Rule | Standard |
|---|---|
| Boundary | Motion components are client components, kept at leaves. Never import motion in a Server Component or a layout |
| Bundle | Wrap with `LazyMotion features={domAnimation}` and use the `m` components so the animation engine loads lazily |
| What to animate | `transform` and `opacity` only. Never animate width/height/top/left on large trees |
| Duration tokens | fast 150ms (hover, press), base 250ms (enter/exit), slow 400ms (page-level). Nothing over 500ms for UI feedback |
| Easing | ease-out for entering, ease-in for leaving, spring only for gesture-driven motion |
| Reduced motion | `<MotionConfig reducedMotion="user">` at the provider; custom CSS animations are wrapped in `motion-safe:` or disabled under `@media (prefers-reduced-motion: reduce)`. Essential info never depends on motion |
| Lists | Animate at most a screenful; never animate each row of a large or virtualized list |
| Layout shift | Reserve space; animated elements must not push content after first paint |
| Loading | Skeleton shimmer is CSS; spinners only for inline button/loading states |
| Page transitions | Avoid in the App Router unless the product requires them; they interact poorly with streaming and back/forward |

## Example

```tsx
'use client';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';   // check import path for the pinned package

export function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {open && (
          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
```

## Testing

Disable animations in unit tests (set the library's global skip-animations option or mock `motion`), so assertions do not wait on transitions. Storybook shows reduced-motion as a toolbar toggle where possible.

## Anti-patterns

- Animating on every route change by default.
- `layout` animations on large lists or tables.
- Infinite decorative loops (distracting; fails WCAG 2.2.2 when longer than 5 seconds without a pause control).
- Motion that conveys state without a non-motion equivalent.
- Importing the full motion bundle in the root layout.
