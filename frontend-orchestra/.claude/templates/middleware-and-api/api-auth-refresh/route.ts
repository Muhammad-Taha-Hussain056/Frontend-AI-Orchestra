// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/auth/refresh';
import { addMarker, safeRedirectPath } from '@/lib/auth/safe-redirect';
import { routes } from '@/lib/routes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const next = safeRedirectPath(req.nextUrl.searchParams.get('next'));
  const refreshed = await refreshSession(req.headers.get('cookie') ?? '');
  if (!refreshed) return NextResponse.redirect(new URL(`${routes.login}?next=${encodeURIComponent(next)}`, req.url));
  const res = NextResponse.redirect(new URL(addMarker(next, '_r', '1'), req.url));
  refreshed.setCookies.forEach((c) => res.headers.append('set-cookie', c));
  return res;
}
