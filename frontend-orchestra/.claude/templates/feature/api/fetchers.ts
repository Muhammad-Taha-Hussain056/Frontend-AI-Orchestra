import { {{entity}}ListResponseSchema } from '{{scope}}/contracts';
import { apiFetch } from '@/lib/api/client';
import type { {{Entity}}Filters } from './keys';

// Browser path: always through the BFF proxy (/api/...). Never call the backend directly.
export function fetch{{Feature}}(f: {{Entity}}Filters, signal?: AbortSignal) {
  const qs = new URLSearchParams({ page: String(f.page), pageSize: String(f.pageSize), sort: f.sort, q: f.q }).toString();
  return apiFetch(`/{{feature}}?${qs}`, { schema: {{entity}}ListResponseSchema, signal });
}
