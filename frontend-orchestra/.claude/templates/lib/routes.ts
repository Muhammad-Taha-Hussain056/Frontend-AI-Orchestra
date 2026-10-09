export const routes = {
  home: '/',
  login: '/login',
  forbidden: '/forbidden',
  refresh: (next: string) => `/api/auth/refresh?next=${encodeURIComponent(next)}`,
  {{entity}}: (id: string) => `/{{feature}}/${id}`,
} as const;

// Single source of truth for middleware and pages.
const PUBLIC_PREFIXES = ['/login', '/register', '/forbidden', '/legal', '/pricing'];
export const publicRoutes = ['/', ...PUBLIC_PREFIXES];
export const isPublicRoute = (pathname: string) => pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
