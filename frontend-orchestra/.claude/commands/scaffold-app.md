---
description: Scaffold a Turborepo + Next.js app (or a new app in an existing monorepo) from the templates
argument-hint: "<app-name> [new-monorepo]"
---

Scaffold: $ARGUMENTS

1. Load `arch-monorepo-layout`, `arch-code-placement`, `tool-ts-eslint-prettier`, `tool-husky-commitlint`, `tool-testing`, `ui-layers-tokens`. Read `.claude/orchestra.config.json` (scope, packages).
2. **Pin versions deliberately:** check current stable versions of Next.js, React, TanStack Query, Zod, Tailwind, Vitest, MSW, Husky, lint-staged and Storybook in their official docs/registry, show me the list, and wait for approval. Record them in the `pnpm-workspace.yaml` catalog.
3. If `new-monorepo`: create `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `packages/{ui,contracts,utils,config-typescript,config-eslint,config-tailwind}` from `templates/config` and `templates/ui`; set up Husky, lint-staged, commitlint; contracts built with tsup and set up for private-registry publishing with Changesets.
4. Create `apps/<app-name>`: Next.js app with `src/{app,features,components,lib}`; copy `templates/lib/*`, `templates/middleware-and-api/*`, providers in the root layout, fonts, `src/test/*`, `.env.example` (names only), `next.config` with `transpilePackages` and exact `images.remotePatterns`.
5. Add the app to `orchestra.config.json`.
6. Verify: `pnpm install`, `pnpm turbo run typecheck lint test build`. Report failures; do not suppress rules to pass.
