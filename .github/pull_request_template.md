## What

Closes #

<!-- One or two sentences. Link the spec: docs/specs/Sx/Sx-yy-....md -->

## Behavior checked

<!-- Which Given/When/Then from the spec you demoed, and how. -->

## Constitution checklist (AGENTS.md)

- [ ] The spec has a Technical plan and Tasks, and is updated if behavior changed
- [ ] `npm run check` is green (format, lint with constitution rules, types, unit tests, migration guard)
- [ ] `npm run db:test` is green, or this PR has no database change
- [ ] No constitution lint rule is disabled or downgraded
- [ ] Docs kept in sync (ROUTES / access.ts, STATE_MACHINES, DESIGN)

## Security checklist (docs/SECURITY.md)

- [ ] No new client write grants, or each one is column-scoped and justified
- [ ] State changes go through an RPC that checks actor, state, and locks rows
- [ ] New functions set `search_path = ''`
- [ ] pgTAP tests for the allowed actor and at least one denied actor
- [ ] No PII, tokens or coordinates in logs
- [ ] No new third-party script, font or origin (or CSP updated with a reason)
- [ ] Exact locations and phones stay need-to-know

## Screens

<!-- 390 px wide screenshots for UI changes. -->
