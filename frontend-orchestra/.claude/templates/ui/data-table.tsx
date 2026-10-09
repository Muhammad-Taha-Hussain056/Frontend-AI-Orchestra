'use client';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState, type OnChangeFn } from '@tanstack/react-table';
import { cn } from './cn';

export type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number; page: number; pageSize: number;
  isLoading?: boolean; isFetching?: boolean; error?: Error | null; onRetry?: () => void;
  sorting?: SortingState; onSortingChange?: OnChangeFn<SortingState>;
  onPageChange: (page: number) => void;
  emptyTitle: string; caption: string;
  getRowId?: (row: T) => string;
};

export function DataTable<T extends { id: string }>(p: DataTableProps<T>) {
  const table = useReactTable({
    data: p.data, columns: p.columns, getCoreRowModel: getCoreRowModel(),
    manualPagination: true, manualSorting: true, manualFiltering: true,
    pageCount: Math.max(1, Math.ceil(p.total / p.pageSize)),
    state: { sorting: p.sorting ?? [], pagination: { pageIndex: p.page - 1, pageSize: p.pageSize } },
    onSortingChange: p.onSortingChange,
    getRowId: p.getRowId ?? ((r) => r.id),
  });
  const pages = Math.max(1, Math.ceil(p.total / p.pageSize));

  if (p.error) return (<div role="alert" className="space-y-2"><p>Could not load data.</p>{p.onRetry && <button type="button" onClick={p.onRetry} className="underline">Retry</button>}</div>);

  return (
    <div className="space-y-3">
      <div className={cn('overflow-x-auto rounded-md border', p.isFetching && 'opacity-80')} aria-busy={p.isFetching}>
        <table className="w-full text-sm">
          <caption className="sr-only">{p.caption}</caption>
          <thead className="bg-muted text-left">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>{hg.headers.map((h) => (
                <th key={h.id} scope="col" className="px-3 py-2 font-medium"
                  aria-sort={h.column.getIsSorted() === 'asc' ? 'ascending' : h.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>))}
              </tr>))}
          </thead>
          <tbody>
            {p.isLoading
              ? Array.from({ length: 5 }, (_, i) => (<tr key={i} aria-hidden="true">{p.columns.map((_c, j) => <td key={j} className="px-3 py-3"><div className="h-4 animate-pulse rounded bg-muted" /></td>)}</tr>))
              : table.getRowModel().rows.length === 0
                ? (<tr><td colSpan={p.columns.length} className="px-3 py-10 text-center text-muted-foreground">{p.emptyTitle}</td></tr>)
                : table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t">{row.getVisibleCells().map((c) => <td key={c.id} className="px-3 py-2">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}</tr>))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
        <span>Page {p.page} of {pages}</span>
        <div className="flex gap-2">
          <button type="button" disabled={p.page <= 1} onClick={() => p.onPageChange(p.page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">Previous</button>
          <button type="button" disabled={p.page >= pages} onClick={() => p.onPageChange(p.page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      </nav>
    </div>
  );
}
