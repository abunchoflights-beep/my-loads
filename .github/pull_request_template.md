## What

Closes #

<!-- One or two sentences. Link the spec: docs/specs/Sx/Sx-yy-....md -->

## Behavior checked

<!-- Which Given/When/Then from the spec you demoed, and how. -->

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
