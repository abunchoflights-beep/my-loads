---
id: S7-03
title: "Admin console: KPIs and audit viewer"
sprint: 7
milestone: "Sprint 7 · Trust"
labels: [spec, sprint-7, admin]
status: todo
---

# S7-03 · Admin console: KPIs and audit viewer

**Status:** Not started

## Requirement

As operations, I see how the marketplace is doing and can trace any change.

## Behavior

- Given `/admin`, then I see GMV, orders by status, time to accept, time to book, fill rate, disputes rate.
- Given `/admin/audit`, then I can filter by table, record and actor.

## Invariants

- Admin queries go through RLS with `is_admin()` (aal2), not a service key.

## Acceptance criteria

- [ ] KPI views
- [ ] Audit viewer with pagination
- [ ] CSV export
