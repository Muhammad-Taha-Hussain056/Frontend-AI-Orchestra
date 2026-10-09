---
name: code-review
description: Review code for correctness, security, performance, maintainability, and architectural issues.
---

# Code Review

When reviewing code:

## Check correctness

- Look for logic errors.
- Check edge cases.
- Check null/undefined handling.
- Check async/await and error handling.
- Check race conditions.

## Check security

- Look for IDOR vulnerabilities.
- Check authentication and authorization.
- Check input validation.
- Check SQL/NoSQL injection.
- Check XSS.
- Check sensitive data exposure.
- Check insecure file uploads.
- Check rate limiting where appropriate.

## Check performance

- Look for N+1 queries.
- Unnecessary database calls.
- Unnecessary API requests.
- Large memory allocations.
- Expensive loops.
- Missing pagination.
- Missing caching where appropriate.

## Check maintainability

- Duplication.
- Poor naming.
- Large functions.
- Incorrect separation of concerns.
- Unnecessary abstractions.

## Output

For every issue provide:

1. Severity: Critical / High / Medium / Low
2. File and line
3. Problem
4. Why it matters
5. Recommended fix

Do not report stylistic issues unless they materially affect maintainability.
Do not invent problems.
