---
id: S4-05
title: "Lane alerts for carriers"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, carrier, notifications]
status: todo
---

# S4-05 · Lane alerts for carriers

**Status:** Not started

## Requirement

As a carrier, I get notified when a load is posted on a lane I drive (for example Urabá to Medellín).

## Behavior

- Given a saved lane (origin department, destination department, body), when a matching load is posted, then I'm notified.

## Invariants

- Alerts only fire for verified carriers with an eligible vehicle.

## Acceptance criteria

- [ ] `carrier_lanes` table with RLS
- [ ] Outbox trigger on load posted
- [ ] Manage lanes screen
