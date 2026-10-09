---
description: Create a design-system component in packages/ui with variants, story and accessibility review
argument-hint: "<component-name> <purpose>"
---

Create the component: $ARGUMENTS

1. Delegate to the `ui-builder` agent. It must load `ui-layers-tokens`, `ui-storybook`, `ui-a11y-checklist` (and `ui-motion` if animated).
2. First check whether shadcn provides the component; start from it if so.
3. Requirements: domain-agnostic (no contracts/feature imports), semantic tokens only, `cva` variants, named export, typed props extending native element props, all states (hover, focus-visible, disabled, loading, error).
4. Add `<name>.stories.tsx` with Default, every variant/size, states, Dark, Responsive (if relevant) and an Interaction story.
5. Run `pnpm turbo run typecheck lint test --filter=@scope/ui`, then the `a11y-reviewer` agent, then `standards-reviewer`.
6. Report the public API (props) and any shadcn customizations.
