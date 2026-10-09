import 'server-only';
import { env } from '@/lib/env';
import { REFRESH_COOKIE } from './cookies';

export type RefreshResult = { setCookies: string[]; cookieHeader: string };
const inFlight = new Map<string, Promise<RefreshResult | null>>();

const cookieValue = (header: string, name: string) =>
  header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? '';

function mergeCookies(original: string, setCookies: string[]): string {
  const jar = new Map(original.split(';').map((c) => c.trim()).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)] as const; }));
  for (const sc of setCookies) { const [pair = ''] = sc.split(';'); const i = pair.indexOf('='); jar.set(pair.slice(0, i).trim(), pair.slice(i + 1)); }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function doRefresh(cookieHeader: string): Promise<RefreshResult | null> {
  const res = await fetch(`${env.API_URL}${env.AUTH_REFRESH_PATH}`, { method: 'POST', headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (!res.ok) return null;
  const setCookies = res.headers.getSetCookie();
  return setCookies.length ? { setCookies, cookieHeader: mergeCookies(cookieHeader, setCookies) } : null;
}

/** Single-flight per refresh token: parallel 401s trigger ONE refresh (prevents rotation logouts). */
export function refreshSession(cookieHeader: string) {
  const key = cookieValue(cookieHeader, REFRESH_COOKIE);
  if (!key) return Promise.resolve(null);
  const existing = inFlight.get(key); if (existing) return existing;
  const p = doRefresh(cookieHeader).finally(() => setTimeout(() => inFlight.delete(key), 5_000));
  inFlight.set(key, p); return p;
}
