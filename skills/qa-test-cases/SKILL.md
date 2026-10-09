---
name: qa-test-cases
description: Generate a QA-facing Markdown test-case document for a new or changed feature, for handoff to QA.
---

# QA Test Cases

Produces a test-case document a QA engineer can execute manually, without
reading any code. Triggered via `/qa-test-cases`, or automatically by the
pre-push pipeline (`scripts/review/run-review.mjs`) against the diff about
to be pushed.

## What to look at

- The diff or feature description given in the invocation.
- Read the actual changed files, not just the diff — follow call sites far
  enough to understand user-facing behavior (a handler change matters for
  what it does to the page/flow that calls it, not the handler in
  isolation).

## Output

Write a Markdown file to `qa/test-cases/<slug>.md`, where `<slug>` is a short
kebab-case name for the feature/change (derived from the branch name, the
changed module, or the feature description). If a file already exists for
this feature, update it in place — don't create a duplicate.

Structure:

```markdown
# <Feature name>

**Summary:** one paragraph, plain language, no code terms a non-engineer
wouldn't know.

**Preconditions:** what state the system/account/data needs to be in before
testing starts.

## Test cases

| ID   | Title | Steps          | Expected result | Priority        |
| ---- | ----- | -------------- | --------------- | --------------- |
| TC-1 | ...   | 1. ...\n2. ... | ...             | High/Medium/Low |

## Edge cases

- ...

## Out of scope

- Anything intentionally not covered by this change.
```

## Rules

- Every test case must be executable by someone with no code access — no
  file paths, function/variable names, or internal jargon in the steps.
- Cover the happy path, at least one validation/error case, and any
  permission/auth boundary touched by the change (e.g. company vs. agency
  user, org membership, agency impersonation).
- Keep it proportional to the change — a two-line copy tweak doesn't need
  ten test cases.
- Do not invent behavior that isn't in the diff.
