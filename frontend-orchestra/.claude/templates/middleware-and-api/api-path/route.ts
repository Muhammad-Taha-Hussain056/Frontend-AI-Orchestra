// src/app/api/[...path]/route.ts  : the single BFF proxy (see skill data-bff-proxy)
import { NextRequest, NextResponse } from 'next/server';
import { applyCacheTags } from '@/lib/api/cache-tags';
import { refreshSession } from '@/lib/auth/refresh';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORWARD_REQ = ['accept', 'accept-language', 'content-type', 'cookie', 'idempotency-key', 'if-match', 'if-none-match', 'user-agent'];
const DROP_RES = new Set(['connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'content-encoding', 'content-length', 'set-cookie']);

const problem = (status: number, title: string) =>
  NextResponse.json({ type: 'about:blank', title, status }, { status, headers: { 'content-type': 'application/problem+json' } });

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (path.some((s) => !s || s === '.' || s === '..' || /[\\/]/.test(s))) return problem(400, 'Invalid path');

  if (!SAFE.has(req.method)) {
    const site = req.headers.get('sec-fetch-site');
    const sameOrigin = site ? site === 'same-origin' : req.headers.get('origin') === new URL(env.APP_URL).origin;
    if (!sameOrigin) return problem(403, 'Cross-site request blocked');
  }

  const headers = new Headers();
  for (const h of FORWARD_REQ) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  headers.set('x-request-id', req.headers.get('x-request-id') ?? crypto.randomUUID());

  const url = `${env.API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const body = SAFE.has(req.method) ? undefined : await req.arrayBuffer();   // large files use presigned uploads, never this route
  const send = (h: Headers) => fetch(url, { method: req.method, headers: h, body, redirect: 'manual', cache: 'no-store' });

  let upstream = await send(headers);
  const setCookies: string[] = [];
  if (upstream.status === 401 && headers.get('cookie')) {
    const refreshed = await refreshSession(headers.get('cookie')!);
    if (refreshed) { setCookies.push(...refreshed.setCookies); headers.set('cookie', refreshed.cookieHeader); upstream = await send(headers); }
  }
  setCookies.push(...upstream.headers.getSetCookie());
  if (!SAFE.has(req.method) && upstream.ok) await applyCacheTags(req.method, path.join('/'));

  const out = new Headers();
  upstream.headers.forEach((v, k) => { if (!DROP_RES.has(k.toLowerCase())) out.set(k, v); });
  setCookies.forEach((c) => out.append('set-cookie', c));
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
