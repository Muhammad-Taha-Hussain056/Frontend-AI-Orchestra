---
name: x-auth-permissions
description: Permission model on the frontend - permission strings from the session, the can() helper for server and client, the Can component, route-level requirePermission, 403 handling, and when to adopt CASL for attribute-based rules. Use whenever you show or hide UI by user role or permission, protect a page or action, add an admin-only feature, or see role-name checks like user.role === 'admin' in code.
---

# Permissions

The backend (NestJS RBAC/ABAC) is the authority. The frontend **mirrors** permissions to shape the UI and to fail fast; it never replaces backend enforcement. Session and cookie handling is in `next-middleware-auth`.

## Model

`/auth/me` returns the session including `permissions: string[]` (e.g. `orders:read`, `orders:create`, `billing:manage`) defined in `@scope/contracts` as a typed union (`Permission`). Pages never reason about **roles**; roles are a backend grouping of permissions.

```ts
// src/lib/auth/can.ts   (pure; usable on server and client)
import type { Permission, Session } from '@scope/contracts';
export const can = (session: Pick<Session, 'permissions'> | null | undefined, permission: Permission) =>
  !!session?.permissions.includes(permission);
```

## Where it is used

| Place | How |
|---|---|
| Protected page / layout (server) | `const session = await requirePermission('orders:read')` from `src/lib/auth/session.ts`: redirects to login if no session, renders `forbidden` UI/`notFound()` per project policy if missing permission |
| Server-rendered action buttons | `can(session, 'orders:create') && <CreateOrderButton />` |
| Client components | `useCan('orders:create')` reading the session query (`getSession` hydrated into Query at the layout) or pass booleans as props from the server |
| Declarative UI | `<Can permission="orders:delete" fallback={null}>...</Can>` in `src/components` |
| BFF / NestJS | Always enforced by the backend; the BFF forwards, never decides |

## Rules

1. Check **permissions**, never role names or user ids, in UI code.
2. Hiding is convenience, not security: every mutation must also be authorized by the backend. A 403 from the backend is expected and handled (`form-error-mapping`).
3. The session is fetched once per request (`getSession` is cached). On the client, the session lives in the Query cache with a standard `staleTime`; permission changes take effect on the next refetch or re-login.
4. Disabled vs hidden: hide actions the user can never perform; disable (with an explanation tooltip) actions blocked by state, not permission.
5. Feature flags (`x-feature-flags`) are separate from permissions; do not encode entitlements as flags.
6. Tests cover both a permitted and a forbidden user for every gated screen.

## ABAC and CASL

Plain permission strings cover most apps. Adopt **CASL** only when rules depend on resource attributes (owner, status, tenant, "can edit own draft orders"). Then: define abilities from the session in one place (`src/lib/auth/ability.ts`), expose `useAbility`, and keep the rule definitions aligned with the backend's (shared through contracts when possible). Record the adoption reason in the PR.

## Anti-patterns

- `if (user.role === 'admin')`.
- Trusting a permission list stored in `localStorage` or decoded from a JWT on the client.
- Gating only in the UI.
- Permission checks in middleware (`next-middleware-auth` explains why).
- Large `switch` statements per role scattered across features.
