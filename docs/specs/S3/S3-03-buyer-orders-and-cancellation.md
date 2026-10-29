---
id: S3-03
title: "Buyer orders and cancellation"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, buyer, orders]
status: partial
---

# S3-03 · Buyer orders and cancellation

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a buyer, I see all my orders with their status, and can cancel before the goods move.

## Behavior

- Given a pending order, when I cancel, then it's cancelled with no penalty.
- Given an accepted order not yet picked up, when either party cancels with a reason, then stock goes back to the listing and the load is cancelled.
- Given a picked-up load, then cancel fails with `LOAD_ALREADY_MOVING`.

## Invariants

- Cancelling never loses stock: `available_kg` is restored exactly.

## Acceptance criteria

- [x] `cancel_order()` and tests
- [ ] Orders list with filters by status
- [ ] Cancellation sheet with reason
