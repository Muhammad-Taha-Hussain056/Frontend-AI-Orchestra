import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionSchema, type Permission } from '{{scope}}/contracts';
import { serverFetch } from '@/lib/api/server';
import { routes } from '@/lib/routes';
import { can } from './can';

export const getSession = cache(async () => {                    // one backend call per request
  const res = await serverFetch('/auth/me', { allow401: true });
  return res.status === 401 ? null : sessionSchema.parse(await res.json());
});

async function loginUrl() {
  const here = (await headers()).get('x-pathname') ?? '/';
  return `${routes.login}?next=${encodeURIComponent(here)}`;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect(await loginUrl());
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireUser();
  if (!can(session, permission)) redirect(routes.forbidden);     // or notFound(), per project policy
  return session;
}
