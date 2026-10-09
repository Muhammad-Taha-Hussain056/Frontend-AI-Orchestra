---
name: tool-ts-eslint-prettier
description: Code-quality tooling standard - shared TypeScript configs (strict + noUncheckedIndexedAccess), ESLint flat config with Next, typescript-eslint, TanStack Query and boundaries rules, the custom bans (raw colors, any, ts-ignore, direct process.env), Prettier with Tailwind class sorting, and monorepo script conventions. Use whenever you create or edit tsconfig, eslint config, prettier config, lint scripts, fix lint or type errors, add a lint rule or suppression, or set up a new package or app.
---

# TypeScript, ESLint, Prettier

Config packages: `@scope/config-typescript`, `@scope/config-eslint`, `@scope/config-tailwind` (see `arch-monorepo-layout`). Starting files are in `templates/config/`. Do not weaken these settings to make code pass.

Version note: ESLint flat config is assumed. ESLint, `eslint-config-next`, `typescript-eslint` and plugin APIs move quickly; some Next versions no longer ship a `next lint` command, so scripts call `eslint` directly. Check the pinned versions' docs (UNVERIFIED here).

## TypeScript

`config-typescript/base.json` (extended by `nextjs.json` and `library.json`):

| Option | Setting |
|---|---|
| `strict` | `true` |
| `noUncheckedIndexedAccess` | `true` (decision: strict plus this; not `exactOptionalPropertyTypes`) |
| `noImplicitOverride`, `noFallthroughCasesInSwitch` | `true` |
| `verbatimModuleSyntax`, `isolatedModules` | `true` (`import type` for types) |
| `moduleResolution` | `bundler` for apps and ui; `NodeNext`/library-appropriate for `contracts` (compiled for the backend) |
| `skipLibCheck` | `true` |
| `paths` | App only: `"@/*": ["./src/*"]` |

Rules: no `any` (use `unknown` and narrow); no `@ts-ignore`; `@ts-expect-error` only with a reason comment; non-null `!` only with a comment explaining the invariant; infer types from Zod (`z.infer`) instead of duplicating; never cast API data, parse it.

## ESLint (flat config, shared)

Layers in `config-eslint`: `base` (TS + import hygiene), `next` (adds Next + React + a11y), `library`. Rules enforced:

| Rule set | Why |
|---|---|
| Next core-web-vitals + `typescript-eslint` recommended (type-checked) and stylistic | Baseline correctness |
| `react-hooks`, `jsx-a11y` (from the Next config) | Hooks and basic accessibility lint |
| `@tanstack/eslint-plugin-query` recommended | `exhaustive-deps` for keys, stable client, no rest destructuring |
| `eslint-plugin-boundaries` | Feature isolation (`arch-feature-boundaries`) |
| Import sorting plugin | Deterministic import order |
| `no-restricted-imports` | Ban `next/router` (App Router), `axios`, `moment`, `@radix-ui/*` outside `packages/ui`, cross-package relative paths |
| `no-restricted-syntax` / `no-restricted-properties` | Ban raw palette classes in string literals, `process.env` outside `src/lib/env.ts`, `console.log` (warn), `dangerouslySetInnerHTML` outside `JsonLd` |
| `@typescript-eslint/no-explicit-any`, `ban-ts-comment` | Enforce the TS rules above |
| `no-default-export` except Next special files, stories, configs | Named exports everywhere else |

Raw-color ban (shape):

```js
{
  selector: "Literal[value=/\\b(bg|text|border|ring|fill|stroke|from|to|via)-(white|black|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3})\\b/]",
  message: 'Use semantic tokens (bg-background, text-muted-foreground, ...). See ui-layers-tokens.',
}
```

Suppression policy: `eslint-disable` needs the rule name and a reason after `--`; no file-level disables; no `--max-warnings` loosening. If a rule is wrong for the project, change the shared config in a reviewed PR.

## Prettier

One shared config: single quotes, semicolons, trailing commas `all`, `printWidth` 100, plus `prettier-plugin-tailwindcss` (class sorting; point it at the tailwind entry/config the pinned version expects). Prettier owns formatting; ESLint stylistic rules that conflict are disabled. The Claude hook formats on edit; lint-staged formats on commit.

## Scripts (every workspace exposes the same names)

```json
{ "scripts": { "lint": "eslint .", "typecheck": "tsc --noEmit", "format": "prettier --check .", "format:write": "prettier --write ." } }
```

Run from the root with Turborepo: `pnpm turbo run typecheck lint --filter=...[origin/main]`.

## Anti-patterns

- Turning a rule off for a file instead of fixing the cause.
- `as unknown as T` to silence the compiler.
- Different tsconfig strictness per app.
- Local per-app ESLint configs that copy shared ones.
- Formatting rules in ESLint that fight Prettier.
