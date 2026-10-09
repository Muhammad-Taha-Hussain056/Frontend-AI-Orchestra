---
name: review-feature
description: End-to-end engineering audit of a feature — business logic, user/technical flow, DB+ERD, dependency map, real findings, test coverage — delivered as any combination of an Artifact, a Technical PDF, and a Client-Facing PDF. Invoke as /review-feature <name> [--artifact] [--pdf] [--client-pdf].
---

# `/review-feature` — End-to-End Feature Audit

Produce an evidence-driven, international-quality engineering audit of one feature: how it works today, how data flows through it end-to-end, what it depends on, what depends on it, and what's actually wrong with it — as a polished, client-shareable document.

This is a **manual, interactive** skill (invoked on demand by a developer), unlike `code-review`/`security-review`/`db-schema-validation` which also run headlessly via `.husky/pre-push`. Do not wire this into any git hook.

Match the finding vocabulary and rigor of `code-review` and `security-review` — this is the same standard of engineering review, scoped to a whole feature instead of a diff. Do not produce marketing copy or restate documentation; this is a real audit.

## Step 0 — Parse input

- Feature name/identifier is the first argument (e.g. `TAM`, `Segmentation`, `IP Tracking`, `Authentication`).
- No name given → ask for one. Don't guess a feature from conversation context.

### Output targets are independent and freely combinable

Output is not a fixed set of bundles — it's a set of independent targets, each switched on separately. The current targets:

| Flag           | Target            | Format                                          | Content scope                          |
| -------------- | ----------------- | ----------------------------------------------- | -------------------------------------- |
| `--artifact`   | Artifact          | Interactive HTML, published via `Artifact` tool | Full technical audit (Step 6)          |
| `--pdf`        | Technical PDF     | PDF                                             | Full technical audit (Step 6)          |
| `--client-pdf` | Client-Facing PDF | PDF                                             | Business-only, non-technical (Step 8b) |

Parse **any combination** from the invocation — `--artifact`, `--pdf --client-pdf`, `--artifact --pdf --client-pdf` (all three), etc. These are switches, not mutually exclusive modes. `--both` (legacy) means `--artifact --pdf` for backward compatibility only — prefer the explicit flags going forward.

This table is the single place that defines what targets exist; see "Adding a new output target" under Step 8 for how it stays that way as targets are added.

### Natural-language requests

Map plain-language output requests onto the same targets instead of requiring flags:

- "the artifact" / "web version" → `--artifact`
- "the technical PDF" / "the dev PDF" / "the PDF" (when a client version is also in play, so "PDF" clearly means the technical one) → `--pdf`
- "the client version" / "client-facing" / "for the client" / "stakeholder PDF" / "non-technical version" → `--client-pdf`
- "all three" / "everything" / "generate all outputs" → all targets
- "give me the PDFs" (plural, no other qualifier) → `--pdf --client-pdf`
- Combinations phrased as lists ("the artifact and client PDF", "the technical PDF and artifact") → union the mapped targets

If the request doesn't clearly resolve to one or more targets — including when no output was mentioned at all — stop and ask; never guess.

### Interactive selection

No output resolved (by flag or natural language) → `AskUserQuestion` with **one separate yes/no question per target** in the table above ("Include the Artifact?", "Include the Technical PDF?", "Include the Client-Facing PDF(s)?" — each with a one-line content-scope description), not a single multi-select checkbox list. A multi-select list of N targets _can_ technically reach every combination, but it reads to users as N choices rather than the 2^N−1 combinations actually available, and user feedback has confirmed this — it's easy to miss that multiple boxes can be checked at once. Independent yes/no questions make every combination equally reachable and equally visible, and stay within `AskUserQuestion`'s 4-option-per-question cap regardless of how many targets exist (each question always has exactly 2 options: Yes/No). This can run alongside the feature-name question (Step 0's first bullet) in the same call, since `AskUserQuestion` allows up to 4 questions per invocation.

If every target comes back "no," don't silently default to anything — ask again which output(s) they want.

Never assume the output format, and never collapse the choices back into fixed bundles like "both."

## Step 1 — Feature discovery (cheap, direct recon — no subagents yet)

Before spending any subagent budget, run direct `Glob`/`Grep` yourself across each architectural layer to build a **seed map**: which files/dirs actually relate to this feature, per layer. Don't rely on filename matching alone — grep for the feature's domain terms (route names, table names, service names) as well as its literal name.

Layers to probe:

- **Frontend**: `apps/user/src/routes/`, `apps/agency/src/routes/`, `apps/admin/src/routes/`, `components/dashboard/<feature>/` — always probe all three apps, never just `user`+`agency`. They correspond to the platform's three canonical roles (Customer, Agency, Admin — see "Roles and applications" below); an Admin-facing surface (an internal monitoring or ops view) is easy to miss without a dedicated grep, and it's easy to wrongly assume a feature is customer-only when it also has a quiet internal-facing side.
- **API**: `apps/api/src/routes/<feature>*/`
- **Database**: `services/database/src/schemas/*<feature>*`
- **Services**: `services/*/src/` matching the feature's domain
- **Background jobs / integrations**: `apps/*-cron/`, `apps/*-consumer/`, `apps/*-processor/`, `services/integration-*/`
- **Tests**: co-located `*.test.ts(x)` next to any file found above

**Worked example (TAM)**: seeding this way for `TAM` surfaces frontend routes `apps/user/src/routes/dashboard/(routes)/tam*.tsx` + `components/dashboard/tam/{upload,discover,view}/`, API route groups `apps/api/src/routes/tam/`, `tam-industry/`, `tam-suggestions/`, DB schemas `tam.schema.ts`/`tam-upload-job.schema.ts`/`discovered-tam-cache.schema.ts`, and — easy to miss without grepping dedicated app dirs — **three separate background services**: `apps/tam-processor`, `apps/tam-suggestions-cron`, `apps/tam-suggestions-consumer`. Use this as a calibration reference for how much a single feature name can actually touch.

### Roles and applications

The platform has three canonical roles, each with its own application: **Customer** (`apps/user`), **Agency** (`apps/agency`), **Admin** (`apps/admin`). Record which of these three actually surfaced real hits in the Frontend probe above — this becomes the "roles in scope" list carried through Step 3 and used to split the Client-Facing PDF in Step 8b. A role only belongs on this list because a file/route was actually found for it, never because it seems plausible that it "should" exist.

Don't confuse this with job-function personas _within_ the Customer role (e.g. a dashboard that tailors KPIs for a CEO vs. a salesperson vs. a marketer) — those are sub-flows inside the Customer application, not a fourth canonical role, and belong inside the Customer role's own coverage rather than getting split out on their own.

**If the name is ambiguous** — zero hits, or hits split across clearly unrelated features — stop and `AskUserQuestion` to disambiguate. Do not guess and proceed.

### Read page/screen-assembly files in full

For any component that assembles what actually renders on a screen — a route's top-level component, an "overview"/"index" composition file that imports and lays out a page's sections — read the entire file before treating its output as known. Confirm you've reached the closing tag of the return statement, not just a size-limited prefix (a `Read` call with a `limit` that happens to land mid-file is the classic trap). If the file is long, keep reading with successive `offset`/`limit` calls until you've seen the end, rather than stopping at the first chunk.

A partial read of an assembly file is worse than not reading it at all: it produces false confidence about what a feature actually shows, and every downstream artifact — the technical document's Feature Overview, its findings, and especially each role's Client-Facing PDF — will silently omit real, live, user-facing sections as a result, with no signal that anything was missed. This class of mistake is also the reason two components can live under the same route without meaning the same thing — e.g. a route with multiple tabs, or a folder shared between two different pages — so don't infer a component's purpose from its file path alone; read the route file that actually mounts it and confirm which screen(s) it belongs to.

**The same rule applies one level deeper, to variant/branch components.** When an assembly file switches between named variants (a role, a plan tier, a state machine) and delegates each branch to its own component (`PrioritiesCeo`, `PrioritiesSales`, ...), reading only the switch statement and the shared wrapper is the same trap as truncating a read — it tells you the variants _exist_ but not what each one actually _does_. Read every branch component in full before describing "what a role/tier/state sees." The specific, numeric business rules almost always live in the branch, not the wrapper (e.g. the exact threshold that flips a recommendation, the exact stage-to-list mapping, the exact score bands) — and those specifics are exactly what Step 8b now requires per role.

## Step 2 — Parallel layer investigation (Agent tool)

Spawn one `Agent` (subagent_type: Explore or general-purpose) per layer that Step 1 actually found hits in — skip empty layers entirely. Cap at 5 agents (Frontend, API, Data/DB, Background+Integrations, Tests).

Brief each agent with the seed files from Step 1 for its layer, and require this **fixed return contract** (structured, not free prose — keeps your own context small and makes Step 3 synthesis mechanical):

- **Entry points** — file:line
- **Key files** — path + one-line role each
- **Business rules/conditions observed** — with file:line evidence
- **External calls made** — which service/API, and why
- **DB tables read/written**
- **Candidate findings** — bug/gap/risk, each with file:line evidence, explicitly labeled `possible` (never `confirmed` — that's your job in Step 3)
- **Could not determine** — anything the agent couldn't verify from the code, stated explicitly rather than guessed

## Step 3 — Orchestrator synthesis (you only — no subagent sees all layers)

- **Dependency map**: using all layer results together, trace `Feature → Service → Database`, `Feature → Auth`, `Feature → Queue/Background job`, `Feature → External API`, `Feature → Another feature` (shared DB entities, shared services). This cross-layer view only you can build — no single layer agent has it.
- **Roles in scope**: finalize the Customer/Agency/Admin list from Step 1 against what the Frontend (and, where relevant, API) layer agents actually confirmed — file:line evidence per role, same as any other claim. A feature can be in scope for one, two, or all three; state which and why. This list is the input to Step 8b's per-role Client-Facing PDF split.
- **Verify before promoting**: for every candidate finding that would land at Medium severity or above, `Read` the exact file:line yourself before including it. Do not report a subagent's unverified claim as confirmed. This extends to completeness, not just correctness — before writing "Feature overview," "what's on this page," or any role's Step 8b content, confirm the underlying assembly file(s) were read in full (see Step 1's "Read page/screen-assembly files in full") rather than trusting an earlier partial read.
- **Classify every claim** as one of: **Confirmed from code** / **Inferred behavior** / **Potential issue** / **Recommendation**. Never blur these categories. If something can't be determined from the repo, say so explicitly rather than filling the gap with a plausible guess.

## Step 4 — Findings

Use the same format as `code-review`/`security-review`:

- **Severity**: Critical / High / Medium / Low
- **Location**: file:line
- **What's wrong**
- **Why it matters**
- **Expected behavior**
- **Recommended fix**

Cover: bugs, missing edge cases, broken flows, inconsistent business logic, security/authz issues, validation gaps, error-handling problems, race conditions, data-consistency problems, performance concerns (N+1 queries, unnecessary DB calls), poor architectural patterns, dead/unused code, missing tests, incomplete implementation, technical debt, production risks. Do not report speculative issues as confirmed — that's what the Confirmed/Potential/Recommendation split from Step 3 is for.

## Step 5 — Testing analysis

From the Tests layer agent's findings: what's covered today, what's missing (edge cases, failure scenarios, business rules with no test), and a recommended test matrix table (scenario × expected behavior × currently covered?).

## Step 6 — Document structure (technical)

This structure applies to the **Artifact** and **Technical PDF** targets — both render from the same technical HTML (see Step 8). The Client-Facing PDF target uses its own, separate structure defined in Step 8b, not this one.

Executive summary goes **first**: feature purpose, overall implementation status, main flow, key dependencies, DB entities involved, critical findings, overall risk level, recommended next steps. A reader should get the whole picture from this section alone.

Full sections, in order:

1. Title/header
2. Executive summary
3. Feature overview (state the roles/applications in scope from Step 3 — Customer, Agency, and/or Admin — up front)
4. Business logic (problem solved, rules/conditions, states/transitions, scenarios, assumptions)
5. User flow (`User Action → UI → API → Backend → Business Logic → DB/External Service → Response → UI`, each step explained)
6. End-to-end technical flow (entry points → components → endpoints → services → DB ops → external calls → background jobs → response/error handling) — **this should be one of the strongest sections in the document**; a developer should understand the feature without tracing the codebase themselves
7. Architecture overview
8. Dependency map
9. Database schema + ERD (scoped to this feature and its directly related entities — not the whole DB)
10. API flow
11. Detailed implementation flow
12. Findings (Step 4)
13. Risk assessment
14. Test coverage (Step 5)
15. Recommendations

Final verdict block at the **end**:

- **Implementation Status**: Complete / Partial / Incomplete
- **Overall Risk**: Low / Medium / High / Critical
- **Test Coverage**: Good / Partial / Poor
- **Production Readiness**: Ready / Needs Changes / Not Ready

Use tables wherever they improve scannability (comparison, matrix, mapping). Give it a real table of contents, numbered sections, clear headings, and severity callouts — this must read as a professional audit document, not raw AI notes.

## Step 7 — Diagrams and visual treatment

Applies to the technical document (Artifact / Technical PDF). Before drawing the ERD or any flow diagram, load the `artifact-diagramming` skill — depict the mechanism (the actual data path, the actual join), not a restated label. Before building the document's visual design, load `artifact-design` — calibrate this as a polished, utilitarian engineering document (tables, clear hierarchy, restrained palette), not a marketing landing page.

If the Client-Facing PDF is also being generated, load `artifact-design` a second time for that document specifically (see Step 8b) — it gets its own, lighter calibration, not a reuse of the technical document's design pass.

## Step 8 — Output

The pipeline is: **Feature analysis (Steps 1–5, run once) → verified feature data (Step 3's classified dependency map + findings) → output selection (Step 0) → one independent generation pass per selected target.** Steps 1–5 never repeat per target — only generation in this step does.

All selected targets are built from that same verified feature data, but each target has its own content rules and its own file. Generating several targets in one invocation must never let one target's content leak into another — most importantly, each **Client-Facing PDF is authored as its own document from Step 8b's content rules, never produced by trimming, summarizing, or redacting the technical HTML.** If both a technical target and Client-Facing PDF(s) are selected, write separate HTML files and treat each client document as if the technical document didn't exist — reuse only the underlying verified facts (what the feature does, its rules, its scenarios), never the technical document's prose, code, or structure.

### Output targets registry

The full definition of every target lives here and in the flag table in Step 0 — these two tables are the only places that need an entry when a target is added or changed.

| Target            | Flag           | Shares HTML with    | Content structure | Generation                         | File count                   |
| ----------------- | -------------- | ------------------- | ----------------- | ---------------------------------- | ---------------------------- |
| Artifact          | `--artifact`   | Technical PDF       | Step 6            | Publish via `Artifact` tool        | 1, whole feature             |
| Technical PDF     | `--pdf`        | Artifact            | Step 6            | `node scripts/pdf/html-to-pdf.mjs` | 1, whole feature             |
| Client-Facing PDF | `--client-pdf` | _(none — isolated)_ | Step 8b           | `node scripts/pdf/html-to-pdf.mjs` | 1 per role in scope (Step 3) |

The Artifact and Technical PDF stay unified across the whole feature regardless of how many roles it touches — a developer needs the cross-application picture in one document (that's what the Architecture overview and Dependency map sections are for). The Client-Facing PDF is the one target that fans out: one self-contained document per role in scope, never a single document that talks about multiple roles at once. See Step 8b.

### Generation, per selected target

1. **Technical HTML** (needed if `--artifact` and/or `--pdf` selected): write once to `artifact/review-<feature-slug>-<YYYY-MM-DD>.html`, per Step 6/7. `--artifact` publishes it via the `Artifact` tool; `--pdf` renders it with:
   ```
   node scripts/pdf/html-to-pdf.mjs artifact/review-<slug>-<date>.html artifact/review-<slug>-<date>.pdf
   ```
   When both are selected, this HTML is written once and used for both — no duplicate authoring.
2. **Client-Facing PDF(s)** (needed if `--client-pdf` selected): for each role in Step 3's roles-in-scope list, write its own HTML file, `artifact/review-<feature-slug>-<YYYY-MM-DD>-client-<role>.html` (`<role>` = `customer`, `agency`, or `admin`), per Step 8b, then render each:
   ```
   node scripts/pdf/html-to-pdf.mjs artifact/review-<slug>-<date>-client-<role>.html artifact/review-<slug>-<date>-client-<role>.pdf
   ```
   If Step 3 found no role cleanly in scope (a backend/infra feature with no direct role-facing surface), generate a single unsuffixed `artifact/review-<slug>-<date>-client.html`/`.pdf` instead, using generic "who benefits" framing — don't force a role split where none exists.
3. Both PDF commands require Node 22+ (the script checks and fails clearly if not).
4. `artifact/` is already gitignored — nothing produced here gets committed.
5. Tell the user the resulting path(s) for whatever was generated — PDFs stay in `artifact/` in the repo, not copied elsewhere. When multiple Client-Facing PDFs are generated, list each with which role it's for.

### Adding a new output target (future)

To add a target (Markdown, DOCX, Presentation, Client-facing Artifact, etc.) without touching the flag-parsing or combination logic:

1. Add a row to the flag table in Step 0 and the registry table above.
2. If it needs content rules different from both Step 6 (technical) and Step 8b (client-only), add a short "Step 8c" (or similar) defining its structure and inclusion/exclusion rules, following the same pattern as Step 8b.
3. Add its generation command to the "Generation, per selected target" list.
   No other step should need to change — flag parsing, natural-language mapping, and multi-select already operate on the table generically rather than on named cases.

## Step 8b — Client-Facing PDF: content rules

One completely separate, business-only document **per role in scope** (Step 3's Customer/Agency/Admin list) — never one document covering multiple roles. A reader in one role (say, a customer) should never have to read content written for another role (the agency partner, or TAMTracker's own internal admin team) to understand their own document. Each is authored straight from the verified feature data (Step 3), reworded for that role's business reader — not a trimmed or redacted copy of the technical document, and not read from it, and not read from another role's client document either.

**Structure (per role document):**

1. Title/header — feature name, date, and which role/application this document is for (e.g. "for your team," "for agency partners," "for TAMTracker's internal team")
2. Executive summary — what the feature does for _this role's_ business, in outcome terms (not "implementation status")
3. Feature overview — what it is, in plain language, from this role's vantage point
4. Your role in this feature — a full, verifiable walkthrough of how _this_ role experiences the feature, described by capability, not by auth/middleware mechanics. This is the section a domain-expert reader uses to confirm the product is doing what it should — so **depth is not optional here**: don't stop at "sees a personalized list tailored to their role." Name every distinct thing that role's view is built from (every lever, list, decision, or block), and for each one state the actual rule driving it — the specific threshold, the comparison being made, the categories something gets sorted into, the condition that flips a recommendation from one option to another. A reader should be able to check "does a 45% contact rate really trigger the sales-bottleneck framing?" against this section and get a real answer, not have to guess. Mention another role only where it's directly relevant to this role's own experience (e.g. a Customer document may note that an agency partner sees an identical view of their account) — never as a full profile or comparison of every role; that belongs in that other role's own document. If the feature has job-function personas _within_ this role (e.g. a Customer-side dashboard that tailors itself for a CEO vs. a salesperson vs. a marketer), give each persona this same full depth — one subsection per persona, not one shared paragraph — since each is typically driven by its own distinct rule set, not a cosmetic relabeling.
5. Business logic — the problem it solves, its rules, its scenarios, scoped to what this role actually deals with (reuse the substance of Step 6 §4, rewritten with all code/technical framing removed)
6. Business-level workflow — a plain-language "what happens when someone in this role does X" walkthrough, with no API/DB/service names
7. Business outcomes / benefits — the value delivered, risk avoided, or efficiency gained, for this role specifically
8. Relevant user scenarios — concrete "as a [this role / a persona within it], I ..." scenarios grounded in what the audit found the feature actually supports today for this role, not aspirational ones and not other roles' scenarios

**Strictly excluded, even in passing:** file paths/filenames, code snippets, API routes/endpoints, database table/schema names, architecture diagrams, dependency maps, severity-rated technical findings, implementation details, test coverage, and developer terminology (queries, N+1, caching, middleware, handlers, validators, indexes, etc.). A finding with real business impact gets described only by its business-visible symptom and consequence (e.g. "reports can be slow to load for large accounts") — never its technical cause or fix.

**Also excluded: standalone "Recommended action" callouts.** Describe what a feature _does_ — including that it surfaces its own recommendation or call-to-action to the user, if it does — but don't add a separate labeled line where the document itself hands the reader a suggested next step ("Recommended action: expand into segment X"). That reads as the audit prescribing action, which isn't its job here, and it duplicates content that may itself need correcting (product copy can be imprecise — see the verification note below) rather than just described. Consequences of a stated rule (e.g. "accounts left uncontacted at this stage expire unused each month") are fine to keep, since that's a fact about the system's behavior, not advice to the reader — the line to hold is _description of what happens_ vs. _a directive telling the reader what to do about it_.

Before finalizing each document, re-read it once specifically looking for three things: leaked technical terms/identifiers, leaked content that belongs to a _different_ role's document, and any standalone "Recommended action" line that crept back in — the same context that holds the technical findings and every other role's content is writing this one, so the risk is copy-paste/cross-role leakage, not missing information.

Load `artifact-design` for these documents too, but calibrate separately from the technical document: a professional but lighter client summary — no severity-coded finding cards, no monospace/code-styled blocks, no dense technical tables. Reuse one visual identity across all of a feature's role documents (same palette/type system) so they read as a matched set, but keep their content fully independent.

## Efficiency

- Steps 1–5 (discovery, layer investigation, synthesis, findings, testing analysis) run exactly once per invocation, no matter how many output targets are selected — multiple targets only mean multiple passes through Step 8's generation, never repeated analysis.
- Reuse Step 1's seed map throughout — don't re-grep the same layers in Step 2 or Step 3.
- Each layer agent should read its own files once and return the structured contract — don't have agents re-read files another agent already covered.
- Only spawn an additional agent beyond the 5 core layers if dependency tracing in Step 3 uncovers an edge Step 1 didn't surface (e.g. a shared service neither the Frontend nor API agent flagged).
- Depth belongs in the layers that are actually relevant to this feature — an empty layer costs zero agents, not a placeholder "nothing found" investigation.
