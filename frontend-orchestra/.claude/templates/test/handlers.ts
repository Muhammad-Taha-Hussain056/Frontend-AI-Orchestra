import { http, HttpResponse } from 'msw';

// Handlers return data typed from @scope/contracts so tests break when contracts change.
// Errors use RFC 9457 bodies (see skill form-error-mapping).
export const problem = (status: number, title: string, extra: Record<string, unknown> = {}) =>
  HttpResponse.json({ type: 'about:blank', title, status, ...extra }, { status, headers: { 'content-type': 'application/problem+json' } });

export const handlers = [
  http.get('*/api/auth/me', () => HttpResponse.json({ id: 'u1', email: 'user@example.com', permissions: [] })),
];
