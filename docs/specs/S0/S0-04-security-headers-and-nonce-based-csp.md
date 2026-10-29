---
id: S0-04
title: "Security headers and nonce-based CSP"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, security]
status: done
---

# S0-04 · Security headers and nonce-based CSP

**Status:** Scaffolded in this repo

## Requirement

As a user, even if someone manages to put HTML in a listing description, no script of theirs can run on my screen.

## Behavior

- Given any page request, when the proxy runs, then a fresh nonce is generated and the response carries a CSP with `script-src 'self' 'nonce-…' 'strict-dynamic'`.
- Given a browser blocks something, when it reports, then `/api/csp-report` logs a trimmed summary and returns 204.
- Given any response, then HSTS, nosniff, frame denial, referrer policy, COOP, CORP and Permissions-Policy headers are present.

## Invariants

- Production CSP never contains `'unsafe-inline'` or `'unsafe-eval'` in `script-src`.
- Every page renders dynamically (root layout awaits `connection()`), so the nonce is always applied.

## Acceptance criteria

- [x] `buildCsp()` unit tests
- [x] Browser smoke test: landing and signup hydrate with zero CSP violations
- [ ] CSP reports shipped to observability (S8-03)
