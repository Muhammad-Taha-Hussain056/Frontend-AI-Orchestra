# Frontend Orchestra (all 3 batches)

Copy the `.claude/` folder into the root of any Turborepo + Next.js project, then edit only `.claude/orchestra.config.json`.
Requires Node 18+ (hook scripts) and Claude Code.

## Contents
- `CLAUDE.md`: golden rules, skill routing table, agent roster
- `settings.json` + 4 hooks: auto-format; hard-block non-pnpm commands, secrets, `.env` reads, `--no-verify`, cross-feature imports; session-start version report
- 6 agents: frontend-architect, feature-builder, ui-builder, standards-reviewer, a11y-reviewer, test-writer
- 31 skills (flat folders, grouped by prefix): arch-* (3), next-* (5), data-* (4), form-* (2), ui-* (6), x-* (8), tool-* (3)
- 8 commands: /review, /new-feature, /new-form, /new-data-table, /new-ui-component, /enable-i18n, /enable-pwa, /scaffold-app
- `templates/`: real starter code (feature, route, lib, BFF proxy, middleware, config, tests, UI)

## Status
Written from knowledge with a cutoff and **not yet verified against current docs**. Items marked UNVERIFIED in skills (and `next-rendering-modes/references/by-version.md`) must be confirmed against the pinned versions in a verification pass before relying on them. Templates are starting points: pin versions, install, typecheck and adapt.
