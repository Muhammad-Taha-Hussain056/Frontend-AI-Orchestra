---
description: Review the current changes against the orchestra standards
argument-hint: "[optional: paths or branch to review]"
---

Run a standards review of $ARGUMENTS (default: all changes on this branch vs `origin/main`).

1. Delegate to the `standards-reviewer` agent for the code review.
2. If any changed file is UI (components, pages, forms), also delegate to the `a11y-reviewer` agent.
3. Combine both reports into one table sorted by severity, then give a single verdict.
4. Do not fix anything unless I ask; list the fixes in order of priority.
