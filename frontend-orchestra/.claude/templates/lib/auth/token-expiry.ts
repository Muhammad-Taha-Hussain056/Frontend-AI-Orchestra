// Expiry HINT only (no signature check; the backend is the authority). Edge-runtime safe.
export function isAccessTokenFresh(token: string, skewSeconds = 30): boolean {
  try {
    const payload = token.split('.')[1] ?? '';
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof exp === 'number' && exp - skewSeconds > Date.now() / 1000;
  } catch { return false; }
}
