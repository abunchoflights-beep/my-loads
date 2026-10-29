---
id: S8-04
title: "Security review and penetration test"
sprint: 8
milestone: "Sprint 8 · Launch"
labels: [spec, sprint-8, security]
status: todo
---

# S8-04 · Security review and penetration test

**Status:** Not started

## Requirement

As the business, an outside reviewer confirms the controls in docs/SECURITY.md actually hold before we handle real money.

## Behavior

- Given a scoped test (web, API, RLS, storage), then all high findings are fixed and re-tested before launch.

## Invariants

- Trusted Types evaluated; adopted if Next/React run clean.

## Acceptance criteria

- [ ] Threat model refreshed
- [ ] External pentest report
- [ ] Fixes merged
