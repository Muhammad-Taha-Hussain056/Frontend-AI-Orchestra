---
name: arch-monorepo-layout
description: Defines the Turborepo + pnpm monorepo layout, workspace naming, dependency direction and turbo.json task setup. Use whenever creating or moving anything at repo level - adding an app or package, editing turbo.json, pnpm-workspace.yaml, root scripts, shared tsconfig/eslint/tailwind config, or deciding whether code belongs in apps/ or packages/. Use it even when the user only says "add a new app", "create a shared package", or "set up the monorepo".
---

# Monorepo layout (Turborepo + pnpm)

Scope, app names and paths come from `.claude/orchestra.config.json`. Below, `@scope` stands for `config.scope`.

## Layout

```
repo/
├── apps/
│   ├── web/                 # Next.js app (primary)
│   └── admin/               # optional additional Next.js app
├── packages/
│   ├── ui/                  # @scope/ui        shadcn components, tokens, cn()
│   ├── contracts/           # @scope/contracts Zod schemas, shared types, error schema
│   ├── utils/               # @scope/utils     pure helpers (dates, formatting, guards)
│   ├── config-typescript/   # @scope/config-typescript  base/nextjs/library tsconfigs
│   ├── config-eslint/       # @scope/config-eslint      flat configs incl. boundaries
│   └── config-tailwind/     # @scope/config-tailwind    preset + token CSS
├── .claude/                 # this orchestra
├── .husky/  commitlint.config.*  lint-staged.config.*   # root, shared by all workspaces
├── pnpm-workspace.yaml
├── turbo.json
└── package.json             # private, scripts only
```

## Dependency direction (enforced in review)

```
apps  →  packages/ui, contracts, utils, config-*
packages/ui        →  utils, config-*           (NEVER contracts, apps or features: domain-agnostic)
packages/contracts →  zod only                  (no React, no Next, no node-only APIs)
packages/utils     →  pure TS                   (no React, no Next)
packages never depend on apps. No cycles.
```

## pnpm-workspace.yaml with a catalog

Pin shared versions once; workspaces reference `catalog:`.

```yaml
packages:
  - "apps/*"
  - "packages/*"
catalog:
  react: ^19.0.0          # example only: use the versions already pinned in this repo
  zod: ^4.0.0
  typescript: ^5.6.0
```

```jsonc
// apps/web/package.json (excerpt)
{ "dependencies": { "react": "catalog:", "zod": "catalog:", "@scope/ui": "workspace:*", "@scope/contracts": "workspace:*" } }
```

Versions above are placeholders. Never copy them; read the repo's pinned versions.

## Internal packages: how they are consumed

| Package | Strategy | Why |
|---|---|---|
| `ui`, `utils` | Just-in-time: `exports` points at TS source; apps list them in `transpilePackages` | No build step, fast HMR |
| `contracts` | **Compiled** (tsup, ESM + CJS + types) and **published to a private registry** | The NestJS backend is a separate repo and installs it as a normal dependency. `config.contracts.consumption` is `registry` |
| `config-*` | Plain files | Consumed by tooling only |

## Publishing contracts (backend is a separate repo)

The frontend monorepo is the source of truth for `@scope/contracts`; NestJS installs a published version.

1. Build with tsup to `dist/` (ESM + CJS + `.d.ts`); `package.json` has explicit `exports`, `files: ["dist"]`, and `publishConfig` pointing at the private registry.
2. Version with Changesets. Additive change (new optional field, new schema) = minor. Removing or tightening a field, or changing a type = **major**.
3. Rollout order for response-shape changes: backend upgrades and ships first (still accepting the old request shape), then the frontend upgrades. For request-shape changes: frontend ships last.
4. Apps in this repo consume it as `workspace:*`; only the backend consumes the published build. Never commit backend-only code or secrets to this package.
5. CI publishes on merge to main when a changeset exists.

## turbo.json (shape to follow)

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "lint":      { "dependsOn": ["^lint"] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

Older Turborepo versions use `pipeline` instead of `tasks`; use whatever the installed version documents. Every workspace exposes the same script names (`build`, `typecheck`, `lint`, `test`, `dev`) so root commands work everywhere.

## Commands

```bash
pnpm install
pnpm turbo run dev --filter=@scope/web
pnpm turbo run typecheck lint test --filter=...[origin/main]   # only what changed (+ dependents)
pnpm --filter @scope/web add zod                                 # add a dependency to one workspace
pnpm --filter @scope/ui add -D @storybook/react
```

## Adding an app

1. Create `apps/<name>` from the `web` app's config (tsconfig extends `@scope/config-typescript/nextjs`, eslint extends `@scope/config-eslint`).
2. Add the app to `orchestra.config.json` under `apps`.
3. Add `transpilePackages: ["@scope/ui", "@scope/utils"]` in `next.config`.
4. Same scripts as other apps. Own `.env.example`.
5. Microfrontend-style split (multi-zone) is a deliberate decision per project; do not introduce it unprompted.

## Adding a package

1. Justify it: two apps need it, or it is a tooling config. Otherwise it belongs in an app (see `arch-code-placement`).
2. `packages/<name>/package.json` with `"name": "@scope/<name>"`, `"private": true`, explicit `exports`.
3. Respect the dependency direction above.

## Anti-patterns

- Importing across workspaces by relative path (`../../packages/ui/src/...`). Always use the package name.
- A package depending on an app, or `ui` importing `contracts`.
- Duplicated versions of React/Next/Zod across workspaces instead of `catalog:`.
- Root `package.json` holding app dependencies.
- Creating a "shared" package for code only one app uses.
