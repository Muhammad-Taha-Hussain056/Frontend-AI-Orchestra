import type { Permission, Session } from '{{scope}}/contracts';
// Pure; usable on server and client. The backend is always the authority.
export const can = (session: Pick<Session, 'permissions'> | null | undefined, permission: Permission) =>
  !!session?.permissions.includes(permission);
