---
id: S4-04
title: "Carrier unbooks: load goes back to the board"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, carrier, freight]
status: partial
---

# S4-04 · Carrier unbooks: load goes back to the board

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a carrier who can't make it, I release the load early so the buyer can find someone else.

## Behavior

- Given a booked load, when I unbook with a reason, then it returns to `posted`, codes are regenerated, and the shipper is notified.

## Invariants

- Old codes stop working immediately.
- Unbooks count against the carrier's reliability score (S7-01).

## Acceptance criteria

- [x] `carrier_unbook()`
- [ ] pgTAP test that old codes fail after unbook
- [ ] UI with reason
