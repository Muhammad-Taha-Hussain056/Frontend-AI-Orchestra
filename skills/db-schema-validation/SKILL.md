---
name: db-schema-validation
description: Validate Drizzle schema and migration changes for data-integrity risks, unsafe migrations, and schema/migration drift before they ship.
---

# DB Schema Validation

Reviews changes to `services/database/src/schemas/*.schema.ts` and
`apps/api/src/db/migrations/*.sql` in the diff for correctness and safety.
This is a safety check, not a style review — it exists to catch changes
that would fail against real data or silently corrupt/lose it.

If neither `services/database/src/schemas/` nor
`apps/api/src/db/migrations/` is touched by the diff, say so and stop.

## Check migration safety

- A new `.notNull()` column on an existing table with no `.default(...)`
  breaks the migration against existing rows — it needs a default, needs to
  be nullable, or needs an explicit backfill step in the generated SQL.
- Dropping or renaming a column/table/enum value is destructive — flag it if
  there's no evidence data loss was intended (e.g. no backfill, no
  deprecation period).
- A column type change needs an explicit, safe cast — flag it if
  drizzle-kit's generated migration can't guarantee the conversion (e.g.
  `text` -> `integer` on a column that isn't guaranteed numeric).
- Every schema change should have a corresponding file under
  `apps/api/src/db/migrations/` in the diff (generated via `pnpm
db:generate`) — flag schema/migration drift (a `.schema.ts` file changed
  with no matching migration, or vice versa).

## Check data integrity

- `.references(() => otherTable.id, { onDelete: 'cascade' })` should be
  deliberate — flag a cascade that could delete data outside the intended
  scope (e.g. cascading from `organizationSchema` into a table that
  shouldn't be wiped when an org is removed).
- Uniqueness constraints (`.unique()`, `uniqueIndex(...)`) should exist
  wherever the domain implies uniqueness (e.g. external IDs, email,
  org+company pairs).
- Foreign-key columns that are queried or filtered on should have a
  matching `index(...)` — missing indexes on relations are a
  correctness-adjacent risk at scale, not just a performance one.
- `.notNull()` vs. nullable should match the actual domain rules the rest
  of the codebase relies on (check how the column is used in
  `apps/api/src/routes/*` and `services/*`).

## Check consistency

- Column/table naming should follow the existing schema's conventions
  (snake_case DB column names via `text('column_name')`, camelCase TS
  property names, `*Schema` export naming, `*.schema.ts` file naming).
- Enum values (`pgEnum`, paired TS `enum`) and defaults should look
  intentional, not placeholders left over from scaffolding.
- Multi-tenant tables (anything scoped by `organisationId`) should filter
  or index on `organisationId`, consistent with how the rest of the schema
  enforces org isolation.

## Output

For every issue provide:

1. Severity: Critical / High / Medium / Low
2. File and line
3. Problem
4. Why it matters (what breaks, and under what data/traffic condition)
5. Recommended fix

Use Critical/High only for something that would fail a real migration run or
lose/corrupt data — not for missing indexes or naming nits, which are
Medium/Low.

Do not report stylistic issues unless they materially affect safety or
integrity. Do not invent problems.
