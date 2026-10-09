import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { ProblemError } from './problem';

type Options = Omit<RequestInit, 'headers'> & { allow401?: boolean; headers?: Record<string, string> };

// Server client: direct to the backend with the user's cookie. Per-user data => never cached by default.
export async function serverFetch(path: string, { allow401, headers: extra, ...init }: Options = {}): Promise<Response> {
  const cookie = (await cookies()).toString();          // async in Next 15+; verify for the pinned version
  const h = await headers();
  const res = await fetch(`${env.API_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { accept: 'application/json', cookie, 'x-request-id': h.get('x-request-id') ?? crypto.randomUUID(), ...extra },
  });
  if (res.status === 401 && !allow401) {
    const here = h.get('x-pathname') ?? '/';
    // Loop guard: if we already came back from a refresh, go to login instead.
    redirect(here.includes('_r=1') ? `/login?next=${encodeURIComponent(here)}` : `/api/auth/refresh?next=${encodeURIComponent(here)}`);
  }
  if (!res.ok && res.status !== 401) throw await ProblemError.fromResponse(res);
  return res;
}
