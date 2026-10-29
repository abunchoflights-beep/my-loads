---
id: S6-03
title: "Release funds on delivery"
sprint: 6
milestone: "Sprint 6 · Payments"
labels: [spec, sprint-6, payments]
status: todo
---

# S6-03 · Release funds on delivery

**Status:** Not started

## Requirement

As a farmer and carrier, I get paid when the buyer confirms receipt, or automatically 48 hours after delivery if there's no dispute.

## Behavior

- Given `completed`, then payouts are scheduled.
- Given a dispute within 48 h, then payout is frozen until resolution.

## Invariants

- Money moves at most once per order (idempotent payouts).

## Acceptance criteria

- [ ] Auto-complete job
- [ ] Payout scheduling
- [ ] Ledger entries per movement
