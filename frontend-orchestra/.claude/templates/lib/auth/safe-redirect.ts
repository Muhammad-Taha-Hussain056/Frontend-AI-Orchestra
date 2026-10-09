// Prevents open redirects through ?next=
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
export function addMarker(path: string, key: string, val: string): string {
  const u = new URL(path, 'http://x'); u.searchParams.set(key, val); return u.pathname + u.search;
}
