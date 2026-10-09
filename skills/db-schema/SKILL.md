---
name: db-schema
description: Document Drizzle schema changes — keep a living schema reference in sync with services/database/src/schemas/ and its migrations.
---

# DB Schema Documentation

Keeps `services/database/SCHEMA.md` in sync with the actual Drizzle schema,
so anyone can understand the data model without reading every file under
`services/database/src/schemas/` and the migration history directly.

Triggered via `/db-schema`, or automatically by the pre-push pipeline
(`scripts/review/run-review.mjs`) against the diff about to be pushed.

## What to look at

- `services/database/src/schemas/*.schema.ts` — the current schema
  (`pgTable` definitions, `pgEnum`s, and `relations()` calls), exported via
  `services/database/src/schemas/index.ts`.
- The diff's changes to those schema files and to
  `apps/api/src/db/migrations/*.sql` — what changed, not just the end
  state.
- Relations between tables (`relations()` blocks and `.references()` calls),
  and how they're used elsewhere in the repo (e.g. `apps/api/src/routes/*`,
  `services/integration-sync`) when the intent behind a column isn't
  obvious from the schema alone.
- If nothing under `services/database/src/schemas/` is touched by the diff,
  say so and do nothing.

## Output

Write (or update in place) `services/database/SCHEMA.md`. This is a single
living document — don't create a new file per change.

Structure:

```markdown
# Database Schema

One paragraph: what this database is for, at a glance.

## Tables

### <table_name>

<one-line purpose>

| Column | Type | Notes |
| ------ | ---- | ----- |
| ...    | ...  | ...   |

**Relations:** <how it relates to other tables, and why>

## Change log

- <date> — <short description of what changed and why, from the migration/diff>
```

## Rules

- Only describe what's actually in the schema files — don't invent columns,
  constraints, or intent that isn't there.
- Keep the "why" (business meaning) as well as the "what" (column/type) — a
  schema dump alone isn't documentation.
- Keep the change log append-only and short — one or two lines per change,
  most recent last.
- Proportional effort: a one-column tweak doesn't need the whole doc
  rewritten, just the relevant table section and a new change-log line.
