---
name: ui-data-table
description: Standard for data grids - the shared DataTable in packages/ui built on TanStack Table, server-side pagination/sorting/filtering driven by URL state and TanStack Query, column definitions in features, selection, empty/loading/error states, responsive behavior, accessibility, and when to add TanStack Virtual. Use whenever you build a table, list grid, admin listing, report view, bulk-action list or sortable/filterable collection, or when a table is slow or its state resets.
---

# Data tables

TanStack Table is headless; the project owns **one** `DataTable` in `packages/ui` (template: `templates/ui/data-table.tsx`). Features supply columns and data; they never build their own `<table>` markup.

## Responsibilities

| Concern | Owner |
|---|---|
| Markup, sticky header, scroll container, empty/loading/error rendering, a11y attributes | `DataTable` (`packages/ui`) |
| Column definitions (`ColumnDef[]`), cell renderers, row actions | Feature (`columns.tsx`) |
| Page/sort/filter/search state | **URL search params** (Zod-parsed, defaulted) |
| Data fetching | TanStack Query with the URL state in the key; server prefetch uses the same parsed state |
| Selection, column visibility | Table state (local); persisted only if the user expects it |

## Server-side by default

```tsx
const table = useReactTable({
  data: rows,                                   // stable reference (from query), never rebuilt per render
  columns,                                      // module-level constant or useMemo
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, manualSorting: true, manualFiltering: true,
  pageCount: Math.ceil(total / pageSize),
  state: { sorting, pagination: { pageIndex: page - 1, pageSize } },
  onSortingChange, onPaginationChange,          // write to the URL
  getRowId: (row) => row.id,                    // stable ids so selection survives refetch
});
```

Use `placeholderData: keepPreviousData` so the table does not blank between pages. Client-side row models are allowed only for small, bounded, fully loaded lists (under about 200 rows).

## Required states

- **Loading:** skeleton rows matching column layout (not a spinner); keep header visible.
- **Empty:** message plus the primary action; distinguish "no data yet" from "no results for these filters" (with a Clear filters action).
- **Error:** inline alert with retry; keep filters intact.
- **Fetching in background:** subtle progress indicator, table stays interactive.

## Virtualization (TanStack Virtual)

Add only when the **rendered DOM** would exceed roughly 200-300 rows (infinite scroll, huge client lists). Requirements: fixed or measured row height, a scroll container with an explicit height, `overscan` of 5-10, stable keys. Paginated tables do not need it.

## Accessibility

Native `<table>`, `<thead>`, `<th scope="col">`; `<caption>` (visually hidden is fine); sortable headers are buttons with `aria-sort` on the `<th>`; row selection checkboxes labelled ("Select row for {name}"); row actions reachable by keyboard; focus returns sensibly after actions; do not use `div` grids with `role="grid"` unless implementing full grid keyboard behavior.

## Responsive

The table scrolls horizontally inside its own `overflow-x-auto` container with a sticky first column when helpful. For primarily mobile surfaces, render a card list below `md` from the same columns' metadata instead of a squeezed table.

## Cells and actions

Format numbers/dates/currency through shared helpers (`x-dates`, `Intl`); truncate with a tooltip, not clipped text; destructive row actions confirm in a dialog; bulk actions call one bulk endpoint (`data-mutations`).

## Anti-patterns

- Fetching all rows and paginating on the client.
- Filter/sort state in `useState` (lost on refresh, not shareable).
- `columns` recreated every render; `data` mapped inline each render.
- Using array index as row id.
- Per-feature table components that duplicate `DataTable`.
- Virtualizing a 25-row page.
