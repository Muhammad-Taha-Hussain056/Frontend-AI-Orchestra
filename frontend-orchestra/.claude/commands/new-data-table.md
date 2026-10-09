---
description: Add a server-side paginated data table to a feature following the table standard
argument-hint: "<feature> <entity> <columns or endpoint>"
---

Add a data table: $ARGUMENTS

1. Load `ui-data-table`, `data-tanstack-query`, `next-server-vs-client`, `x-dates` and `ui-a11y-checklist`. Stop and report any that are missing from `.claude/skills`.
2. Reuse `DataTable` from `@scope/ui`; never create a feature-local table. If `DataTable` does not exist yet, create it from `templates/ui/data-table.tsx` via the `ui-builder` agent first.
3. Inside the feature: `columns.tsx`, URL-state filter schema and key factory (`templates/feature/api/keys.ts`), browser fetcher, server prefetcher, list hook, table component.
4. Page: server prefetch + `HydrationBoundary` (`templates/app-route/page.tsx`), `loading.tsx` skeleton, `error.tsx`.
5. Include loading, empty (no data vs no results), error and background-fetching states. Add virtualization only if rendered rows will exceed about 200.
6. Add tests (sorting/pagination changes request and URL; states) via `test-writer`, then run `standards-reviewer` and `a11y-reviewer`.
