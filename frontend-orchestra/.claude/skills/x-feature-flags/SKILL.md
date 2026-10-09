---
name: x-feature-flags
description: Feature flag standard - the typed flag registry, env-based evaluation until a flag service is adopted, server evaluation with a client provider, the provider interface for swapping in GrowthBook or Unleash, naming, ownership and expiry, testing. Use whenever you add a feature flag or experiment toggle, gate unfinished functionality, roll out gradually, run an A/B variant, or remove an old flag.
---

# Feature flags

Default (`toggles.featureFlags: "env"`): **typed, env-based flags** evaluated on the server. A flag service (GrowthBook, Unleash, LaunchDarkly) is adopted per project later by implementing the same provider interface; call sites do not change.

## Registry (single file)

```ts
// src/lib/flags/registry.ts
export const FLAGS = {
  'orders.bulkActions': { default: false, owner: 'team-orders', description: 'Bulk actions on the orders table', removeBy: '2026-12-01' },
  'checkout.newPaymentStep': { default: false, owner: 'team-payments', description: 'Redesigned payment step', removeBy: '2026-11-15' },
} as const satisfies Record<string, { default: boolean; owner: string; description: string; removeBy: string }>;
export type FlagKey = keyof typeof FLAGS;
```

Rules: key format `area.behavior` (camelCase after the dot); every flag has `owner`, `description`, `removeBy`; unknown keys fail typecheck.

## Provider interface

```ts
// src/lib/flags/provider.ts
export interface FlagProvider { evaluate(key: FlagKey, ctx: FlagContext): boolean | Promise<boolean> }
export type FlagContext = { userId?: string; tenantId?: string; locale?: string };
```

`EnvFlagProvider` reads `FLAG_<KEY>` environment variables (server-only; unset means the registry default). A service-backed provider replaces it in one file.

## Usage

- **Server (default):** `await isEnabled('orders.bulkActions', ctx)` in Server Components, route handlers and middleware (A/B routing).
- **Client:** the root server layout evaluates the flags the page may need and passes them to `FlagsProvider`; client code uses `useFlag('orders.bulkActions')`. Client code never reads env or a flag service directly, and flag values are never secret.
- Cache: flag values are per request/user; never put them in a shared cache with per-user variation.

## Lifecycle

1. Create with owner and `removeBy`. 2. Roll out. 3. Remove the flag **and the dead branch** by `removeBy`. A script (`pnpm flags:check`, run in CI) fails when a flag is past its `removeBy`.

## Rules

- Flags gate **UI and behavior**, never security or entitlements (`x-auth-permissions`).
- No flag checks inside `packages/ui` or `packages/contracts`; shared code takes a prop.
- Maximum nesting: one flag per decision; no flag combinations that need a truth table.
- Tests set flags explicitly (provider override), covering both branches.
- A/B experiments are flags with variants plus an end date, assigned in middleware (`next-middleware-auth`) and recorded by analytics.

## Anti-patterns

- Boolean env checks (`process.env.NEXT_PUBLIC_X === 'true'`) scattered in components.
- Long-lived flags with no owner.
- Using flags as permanent configuration.
- Evaluating flags in client effects after paint (flash of wrong UI).
