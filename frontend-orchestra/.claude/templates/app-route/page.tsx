// SERVER component. No 'use client'.
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { {{Feature}}Table } from '@/features/{{feature}}';
import { get{{Feature}}Server, parse{{Entity}}Filters } from '@/features/{{feature}}/server';
import { {{entity}}ListOptions } from '@/features/{{feature}}/api/keys';
import { getServerQueryClient } from '@/lib/providers/query-client';
import { requireUser } from '@/lib/auth/session';

export default async function {{Feature}}Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();                                              // real authorization (middleware is only optimistic)
  const filters = parse{{Entity}}Filters(await searchParams);
  const qc = getServerQueryClient();
  await qc.prefetchQuery({ ...{{entity}}ListOptions(filters), queryFn: () => get{{Feature}}Server(filters) });
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <{{Feature}}Table filters={filters} />
    </HydrationBoundary>
  );
}
