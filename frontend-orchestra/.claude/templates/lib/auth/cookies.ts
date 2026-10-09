// Names must match NestJS (orchestra.config.json backend.authCookies).
export const ACCESS_COOKIE = process.env.AUTH_ACCESS_COOKIE ?? 'access_token';
export const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE ?? 'refresh_token';
