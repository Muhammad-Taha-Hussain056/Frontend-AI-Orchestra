// src/middleware.ts  (may be named differently in newer Next versions: check the pinned docs)
import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { isAccessTokenFresh } from '@/lib/auth/token-expiry';
import { isPublicRoute, routes } from '@/lib/routes';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname + search);

  if (isPublicRoute(pathname)) return NextResponse.next({ request: { headers } });
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access && isAccessTokenFresh(access)) return NextResponse.next({ request: { headers } });

  const next = encodeURIComponent(pathname + search);
  if (req.cookies.has(REFRESH_COOKIE)) return NextResponse.redirect(new URL(`/api/auth/refresh?next=${next}`, req.url));
  return NextResponse.redirect(new URL(`${routes.login}?next=${next}`, req.url));
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'] };
