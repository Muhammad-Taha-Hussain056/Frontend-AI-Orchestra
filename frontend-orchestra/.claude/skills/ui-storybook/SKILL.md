---
name: ui-storybook
description: Storybook standard for packages/ui - required stories for every component, CSF3 structure, the required story set (default, variants, states, dark, responsive, interaction), setup, theming decorators, build and CI. Use whenever you add or change a component in packages/ui, create or edit a .stories file, configure Storybook, or document component usage.
---

# Storybook

Required for **every component in `packages/ui`**; optional for app-level components. A component in `packages/ui` without a story is incomplete.

Version note: Storybook's config and package names changed across majors (framework package, addon packaging). Read the pinned version from the repo and follow its docs (UNVERIFIED here).

## Setup

- `.storybook/` lives in `packages/ui`. Framework: React with a Vite builder (the ui package has no Next-specific code, so no Next framework adapter is needed).
- `preview` imports the token CSS and the Tailwind entry, wraps stories in `next-themes`-compatible theming (a toolbar toggle that sets the `dark` class), and sets `parameters.layout: 'centered'` by default.
- Stories sit beside the component: `button.tsx`, `button.stories.tsx`.
- Scripts: `pnpm --filter @scope/ui storybook`, `pnpm --filter @scope/ui build-storybook` (built in CI to catch broken stories).

## Required stories per component

| Story | Purpose |
|---|---|
| `Default` | Minimal usage with realistic content |
| One story per **variant** and **size** (or a single story rendering a matrix) | Visual regression and documentation |
| **States**: hover/focus (via `play` or pseudo-state), disabled, loading, error, empty, long content/overflow | Where bugs live |
| `Dark` | Same component under the dark theme (decorator or `globals`) |
| `Responsive` | A mobile viewport parameter for components with responsive behavior |
| `Interaction` | A `play` function that exercises the keyboard and pointer path (open, select, close) using Testing Library utilities |

## CSF3 shape

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = { title: 'Primitives/Button', component: Button, tags: ['autodocs'], args: { children: 'Save' } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Loading: Story = { args: { loading: true } };
```

Titles follow the layer: `Primitives/*`, `Composed/*`, `Patterns/*`. `args` and `argTypes` document props; `tags: ['autodocs']` generates the docs page.

## Rules

- Stories are deterministic: no network, no random data, fixed dates. Use fixtures.
- Stories use the same tokens and providers as the apps; no story-only styling.
- No domain data from contracts (the ui package is domain-agnostic).
- Run the accessibility checklist (`ui-a11y-checklist`) against the story before requesting review. The a11y addon, if installed, is advisory.
- Visual review tooling (Chromatic or similar) is optional per project.

## Anti-patterns

- A single story that hides most states.
- Stories that import app code or call APIs.
- Unmaintained stories left failing in CI.
- Documenting behavior only in MDX prose while the component lacks an interaction story.
