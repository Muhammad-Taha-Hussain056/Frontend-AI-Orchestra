import 'server-only';
// Server-only public API: prefetchers and server fetchers. Never import this from client components.
import { {{entity}}ListResponseSchema } from '{{scope}}/contracts';
import { serverFetch } from '@/lib/api/server';
import { type {{Entity}}Filters, {{entity}}Keys, parse{{Entity}}Filters, to{{Entity}}Query } from './api/keys';

export { {{entity}}Keys, parse{{Entity}}Filters };

export async function get{{Feature}}Server(filters: {{Entity}}Filters) {
  const res = await serverFetch(`/{{feature}}?${to{{Entity}}Query(filters)}`);   // per-user: no shared cache
  return {{entity}}ListResponseSchema.parse(await res.json());
}
