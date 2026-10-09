# Frontend Orchestra

Standards, skills, agents, commands and hooks for this Turborepo + Next.js frontend.
Project-specific values (scope, apps, toggles) live in `.claude/orchestra.config.json`. Pinned library versions are printed at session start.

## Stack (fixed defaults)

Next.js App Router · TypeScript strict (+`noUncheckedIndexedAccess`) · pnpm + Turborepo · TanStack Query · Zustand (Redux Toolkit only behind a gate) · React Hook Form + Zod · Tailwind + shadcn/ui + Radix · Vitest + React Testing Library + Playwright + MSW · Husky + lint-staged + commitlint. Backend is NestJS in a **separate repo** (httpOnly cookie auth, RFC 9457 errors); `@scope/contracts` is published to a private registry. Zod schemas shared via `packages/contracts`.

## Golden rules (never break; skills explain how)

1. **pnpm only.** `pnpm --filter <pkg> <script>`, `pnpm turbo run <task>`. Never npm, yarn, bun, npx.
2. **Server Components by default.** `'use client'` goes on the smallest leaf, never on a page, layout or barrel file.
3. **Code placement is mechanical:** feature → app shared (`src/components`, `src/lib`) → `packages/*`, promoted only when a second consumer exists.
4. **Features never import other features.** Compose them in routes; share via `src/lib`, `src/components` or packages.
5. **Server data lives in TanStack Query** (server prefetch + `HydrationBoundary`). Never copy it into Zustand or Redux.
6. **Browser never calls NestJS directly.** Reads and mutations go through the BFF proxy. Only SSE/WebSocket connect to the gateway.
7. **Mutations** are `useMutation` → BFF route → NestJS, then invalidate Query keys and Next cache tags together.
8. **Forms** are React Hook Form + Zod, with form schemas derived from `packages/contracts`.
9. **UI** comes only from `@scope/ui`. Semantic tokens only; no raw colors (`bg-white`, `text-gray-500`).
10. **Never cache per-user data in shared caches** (`force-cache`, `use cache`). Anything reading cookies/headers is dynamic.
11. **Dates** are UTC ISO strings on the wire; format only at display, via `date-fns` helpers in `packages/utils`.
12. **User-facing copy** lives in per-feature `messages.ts`, never inline in JSX (keeps `enable-i18n` mechanical).
13. **TypeScript:** no `any`, no `@ts-ignore` (use `@ts-expect-error` with a reason), no unexplained `!`.
14. **Auth:** middleware is an optimistic redirect only. Real authorization runs in the server data layer.
15. **Never invent** libraries, APIs or options. If a skill doesn't cover it, say so and check the docs for the pinned version, or ask.

## Skill routing (load before acting)

| When the task involves | Load skill |
|---|---|
| Adding an app/package, `turbo.json`, workspace config, shared tsconfig/eslint | `arch-monorepo-layout` |
| Creating or restructuring a feature; two features needing each other | `arch-feature-boundaries` |
| Any "where does this file/code go?" question, naming, imports | `arch-code-placement` |
| Adding `'use client'`, passing props server→client, providers, client-only libs | `next-server-vs-client` |
| Choosing static/ISR/dynamic/streaming, caching, `loading.tsx`, `error.tsx` | `next-rendering-modes` |
| Middleware, protected routes, `getSession`/`requireUser`, login/logout, 401, locale/A-B routing | `next-middleware-auth` |
| `next/image`, `next/font`, `next/script`, third-party scripts | `next-assets` |
| Page titles, OG/canonical, sitemap, robots, JSON-LD, noindex | `next-metadata-seo` |
| Reading server data, query keys, staleTime, invalidation, prefetch/hydration, pagination | `data-tanstack-query` |
| Any backend call, fetchers, `src/app/api`, cookies, cache tags, 401 refresh | `data-bff-proxy` |
| Any create/update/delete from the UI, invalidation after writes, idempotency | `data-mutations` |
| Shared client state, Zustand, URL state, "should this be Redux?" | `data-client-state` |
| Any form, validation, wizard, field array, server validation errors | `form-rhf-zod` |
| API errors, RFC 9457, toasts vs field errors, status-code UX | `form-error-mapping` |

| Components, Tailwind classes, shadcn, tokens, dark mode, layout, icons | `ui-layers-tokens` |
| Tables and data grids, row selection, virtualization | `ui-data-table` |
| Charts and data visualization | `ui-charts` |
| Animation, transitions, Framer Motion | `ui-motion` |
| Reviewing or building interactive UI for accessibility (WCAG 2.2 AA checklist) | `ui-a11y-checklist` |
| Component stories, Storybook setup | `ui-storybook` |
| Any user-facing text when i18n is on; locale routing; locale formatting | `x-i18n` |
| Showing, parsing, sending or storing dates and times | `x-dates` |
| Hiding/showing UI by permission, admin-only features | `x-auth-permissions` |
| Feature flags and experiments | `x-feature-flags` |
| Live updates, notifications, chat, SSE/WebSocket | `x-realtime` |
| File upload/download, dropzones, images from users | `x-uploads` |
| Rich text editors | `x-rich-text` |
| Installability, offline, service workers (opt-in) | `x-pwa` |
| tsconfig, ESLint, Prettier, lint rules or suppressions | `tool-ts-eslint-prettier` |
| Husky, lint-staged, commitlint, commit messages, changesets | `tool-husky-commitlint` |
| Writing or changing tests; Vitest/MSW/Playwright setup | `tool-testing` |

`.claude/templates/` holds real code to copy (see its README).

## Agents (delegate by role)

| Agent | Use for |
|---|---|
| `frontend-architect` | Read-only placement/data-flow plan before any non-trivial build |
| `feature-builder` | Building a feature end to end from an approved plan |
| `ui-builder` | Components in `packages/ui` with stories |
| `standards-reviewer` | Reviewing a diff against these skills (blocker/warn report) |
| `a11y-reviewer` | WCAG 2.2 AA manual checklist pass |
| `test-writer` | Unit, integration, E2E tests per the testing standard |

Commands: `/review`, `/new-feature`, `/new-form`, `/new-data-table`, `/new-ui-component`, `/enable-i18n`, `/enable-pwa`, `/scaffold-app`.

## How to work

1. Read `orchestra.config.json` and the session-start version list.
2. For anything beyond a one-file edit, get a plan from `frontend-architect` first.
3. Load only the skills the routing table names. If a referenced skill is missing from `.claude/skills`, say so; never improvise its rules.
4. Verify with `pnpm turbo run typecheck lint test --filter=...[HEAD]` before reporting done, then run `standards-reviewer`.
5. Hooks auto-format and hard-block pnpm violations, secrets, `.env` reads, `--no-verify` and cross-feature imports. A block is a rule, not a bug: fix the cause.
