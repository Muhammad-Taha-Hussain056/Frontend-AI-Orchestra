# Templates

Real code Claude copies instead of inventing boilerplate. Adapt names; do not restructure.

Tokens: `{{feature}}` kebab-case (`orders`), `{{Feature}}` PascalCase (`Orders`), `{{Entity}}` singular Pascal (`Order`), `{{entity}}` singular camel (`order`), `{{scope}}` package scope from `orchestra.config.json`.

| Folder | Copy to | Used by |
|---|---|---|
| `feature/` | `src/features/{{feature}}/` | `/new-feature`, `feature-builder` |
| `app-route/` | `src/app/(app)/{{feature}}/` | `/new-feature` |
| `lib/` | `src/lib/` (create only what is missing) | `/scaffold-app`, skills `data-*`, `next-middleware-auth` |
| `middleware-and-api/` | `src/middleware.ts`, `src/app/api/...` | `/scaffold-app` |
| `test/` | `src/test/` (Vitest setup, MSW server/handlers, `renderWithProviders`) plus `playwright.config.ts` at the app root | `tool-testing`, `test-writer` |
| `config/` | repo root and `packages/config-*` | `/scaffold-app`, `tool-*` skills |
| `ui/` | `packages/ui/src/` | `ui-builder`, `/scaffold-app` |

Assumptions to verify per project: pinned versions (Next, React, TanStack Query, Zod, Tailwind, Vitest, MSW, Husky, lint-staged), `@scope/contracts` exports named in each file (`{{entity}}Schema`, `{{entity}}ListResponseSchema`, `create{{Entity}}InputSchema`, `sessionSchema`, `problemDetailsSchema`), and shadcn/Radix component APIs. Files are starting points, not frozen truth.

UI exports assumed from `{{scope}}/ui` but not included as templates: `Skeleton`, `Input`, `toast` (shadcn `skeleton`, `input`, and the shadcn toast/Sonner component). Add them with the shadcn CLI via the `ui-builder` agent; confirm the current CLI and component names in its docs.
