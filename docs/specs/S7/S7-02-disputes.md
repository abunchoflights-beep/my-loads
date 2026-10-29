---
id: S7-02
title: "Disputes"
sprint: 7
milestone: "Sprint 7 · Trust"
labels: [spec, sprint-7, trust, admin]
status: todo
---

# S7-02 · Disputes

**Status:** Not started

## Requirement

As a buyer who received less or worse than ordered, I open a dispute with evidence and get a fair outcome.

## Behavior

- Given a delivered order within 48 h, then I can open a dispute with reason, kilos affected and photos.
- Given an admin resolution (full, partial, none), then payouts and refunds follow it.

## Invariants

- A dispute freezes payouts for that order.
- Every resolution has a written reason in the audit log.

## Acceptance criteria

- [ ] `disputes` table, RPCs, evidence bucket
- [ ] Buyer dispute flow
- [ ] Admin dispute screen
