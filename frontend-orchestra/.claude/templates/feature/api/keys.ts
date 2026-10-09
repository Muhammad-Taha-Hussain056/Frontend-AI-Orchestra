import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';
import { STALE } from '@/lib/queries/stale-times';
import { fetch{{Feature}} } from './fetchers';

// URL state: parsed and defaulted. The SAME parsed filters feed the server prefetch and the client query key.
export const {{entity}}FiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
  sort: z.string().catch('-createdAt'),
  q: z.string().catch(''),
});
export type {{Entity}}Filters = z.infer<typeof {{entity}}FiltersSchema>;
export const parse{{Entity}}Filters = (raw: Record<string, string | string[] | undefined>): {{Entity}}Filters =>
  {{entity}}FiltersSchema.parse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
export const to{{Entity}}Query = (f: {{Entity}}Filters) => new URLSearchParams({ page: String(f.page), pageSize: String(f.pageSize), sort: f.sort, q: f.q }).toString();

export const {{entity}}Keys = {
  all: ['{{feature}}'] as const,
  lists: () => [...{{entity}}Keys.all, 'list'] as const,
  list: (f: {{Entity}}Filters) => [...{{entity}}Keys.lists(), f] as const,
  details: () => [...{{entity}}Keys.all, 'detail'] as const,
  detail: (id: string) => [...{{entity}}Keys.details(), id] as const,
};

export const {{entity}}ListOptions = (f: {{Entity}}Filters) =>
  queryOptions({ queryKey: {{entity}}Keys.list(f), queryFn: ({ signal }) => fetch{{Feature}}(f, signal), staleTime: STALE.standard });
