---
id: S8-03
title: "Observability"
sprint: 8
milestone: "Sprint 8 · Launch"
labels: [spec, sprint-8, ops]
status: todo
---

# S8-03 · Observability

**Status:** Not started

## Requirement

As the team, we know about errors before users tell us.

## Behavior

- Given an unhandled error, then it reaches the error tracker with no PII.
- Given CSP reports and auth anomalies, then they're on a dashboard with alerts.

## Invariants

- No tokens, phones, documents or coordinates in logs.

## Acceptance criteria

- [ ] Error tracking with PII scrubbing
- [ ] Structured logs
- [ ] Uptime checks and alerting
