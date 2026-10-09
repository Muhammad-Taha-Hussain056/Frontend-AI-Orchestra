---
name: tool-husky-commitlint
description: Git hook and commit standard - Husky hooks (pre-commit with lint-staged, commit-msg with commitlint, pre-push with typecheck and unit tests), Conventional Commits with workspace scopes, lint-staged configuration in a monorepo, CI parity and the no-bypass rule. Use whenever you set up or change Husky, lint-staged, commitlint, commit message conventions, pre-push checks, release/changeset flow, or when a hook fails or is slow.
---

# Husky, lint-staged, commitlint

Version note: Husky and lint-staged setup details changed across majors (Husky 9 uses plain hook files and a `prepare` script). Follow the docs for the pinned versions; items marked UNVERIFIED need confirmation.

## Hooks (decision: pre-commit + commit-msg + pre-push)

| Hook | Runs | Budget |
|---|---|---|
| `pre-commit` | `pnpm exec lint-staged` (ESLint fix + Prettier on **staged files only**) | seconds |
| `commit-msg` | `pnpm exec commitlint --edit "$1"` | instant |
| `pre-push` | `pnpm turbo run typecheck test --filter=...[origin/main]` (changed workspaces and their dependents; **unit tests only**) | under a couple of minutes; Turbo caching makes repeats fast |

E2E, builds and full lint stay in CI. CI re-runs everything: local hooks are a convenience, **CI is the gate**.

Files: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push` (templates in `templates/config/husky/`), and root `package.json` has `"prepare": "husky"`.

## lint-staged in a monorepo

Prefer a `lint-staged.config.mjs` in each workspace so ESLint resolves that workspace's config and runs with the right working directory (lint-staged supports multiple configs, using the nearest one per file; confirm the working-directory behavior for the pinned version, UNVERIFIED):

```js
// apps/web/lint-staged.config.mjs
export default {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,mdx,css,yml,yaml}': ['prettier --write'],
};
```

A root config handles repo-level files (`*.md`, `*.yml`, configs). Never run `tsc` in lint-staged (it ignores staged-only scoping and is slow); typecheck belongs to pre-push and CI.

## Conventional Commits

Format: `type(scope): subject`. Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`, `revert`. Scopes are **workspace names** (`web`, `admin`, `ui`, `contracts`, `utils`, `config`) plus `deps`, `ci`, `release`. Subject: imperative, lowercase, no period, header at most 100 characters; breaking changes use `!` and a `BREAKING CHANGE:` footer.

```
feat(web): add bulk actions to orders table
fix(contracts): make order notes optional
refactor(ui)!: rename Button variant "danger" to "destructive"
```

`commitlint.config.mjs` extends `@commitlint/config-conventional` and sets `scope-enum` from the workspace list (generated from `pnpm-workspace.yaml` where practical).

## Changesets and releases

Changes to `@scope/contracts` (published) require a changeset (`pnpm changeset`); CI fails a PR that touches `packages/contracts/src` without one. Commit type does not drive versions; the changeset does.

## No bypass

`--no-verify` is blocked by the Claude hook and must not be used by people either. A failing hook is fixed at the cause. A slow hook is optimized (narrower filter, caching), not skipped.

## Anti-patterns

- Heavy checks (build, E2E) in hooks.
- Hooks that auto-commit or rewrite unrelated files.
- Scope names that are not workspaces.
- Relying on local hooks without the same checks in CI.
- Committing with `HUSKY=0` as a habit.
