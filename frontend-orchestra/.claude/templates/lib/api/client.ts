import type { ZodType } from 'zod';
import { ProblemError } from './problem';

// Browser client: ALWAYS goes through the BFF proxy (/api/*). Never call the backend directly.
export async function apiFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; schema: ZodType<T>; signal?: AbortSignal; idempotencyKey?: string },
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(opts.idempotencyKey ? { 'idempotency-key': opts.idempotencyKey } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) throw await ProblemError.fromResponse(res);
  return res.status === 204 ? (undefined as T) : opts.schema.parse(await res.json());
}
