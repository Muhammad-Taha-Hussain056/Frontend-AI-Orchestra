---
description: Plan and build a new feature end to end following the orchestra standards
argument-hint: "<feature-name> <short description>"
---

Build the feature: $ARGUMENTS

1. Delegate to `frontend-architect` for a plan (placement, rendering, data flow, schemas, risks). Show me the plan and **wait for my approval**. Do not write code before that.
2. After approval, delegate to `feature-builder` with the approved plan. It must load the skills the plan lists and stop on any missing skill.
3. Contracts live in `packages/contracts` (published package; the backend is a separate repo). If the plan changes a contract, list the contract change, the required version bump and the backend coordination as a separate handoff note; never assume the backend already supports it.
4. When the testing skill exists, delegate to `test-writer`. If it does not, say so and list the tests that still need writing.
5. Delegate to `standards-reviewer` (and `a11y-reviewer` for UI). Fix blockers; list warnings.
6. Finish with: files created/changed, commands run and their results, open questions.
