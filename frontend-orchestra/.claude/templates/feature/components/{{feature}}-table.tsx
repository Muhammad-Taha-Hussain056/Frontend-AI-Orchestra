'use client';
import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '{{scope}}/ui';
import type { {{Entity}} } from '{{scope}}/contracts';
import { use{{Feature}}List } from '../hooks/use-{{feature}}-list';
import type { {{Entity}}Filters } from '../api/keys';
import { messages } from '../messages';

const columns: ColumnDef<{{Entity}}>[] = [
  { accessorKey: 'id', header: 'ID' },
  // add columns; format dates/numbers with shared helpers (x-dates)
];

export function {{Feature}}Table({ filters }: { filters: {{Entity}}Filters }) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const { data, isPending, isError, refetch, isFetching } = use{{Feature}}List(filters);

  const setParam = useMemo(() => (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      total={data?.total ?? 0}
      page={filters.page}
      pageSize={filters.pageSize}
      isLoading={isPending}
      isFetching={isFetching}
      error={isError ? new Error('failed') : null}
      onRetry={() => void refetch()}
      onPageChange={(p) => setParam({ page: String(p) })}
      emptyTitle={filters.q ? messages.noResults : messages.empty.title}
      caption={messages.title}
    />
  );
}
