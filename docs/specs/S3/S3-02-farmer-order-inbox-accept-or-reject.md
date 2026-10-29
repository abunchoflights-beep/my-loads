---
id: S3-02
title: "Farmer order inbox: accept or reject"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, farmer, orders]
status: partial
---

# S3-02 · Farmer order inbox: accept or reject

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a farmer, I see new orders, and accept (with a pickup date when it's platform freight) or reject them with a reason, within 24 hours.

## Behavior

- Given two buyers ordering more than the remaining stock, when I accept both, then the second fails with `INSUFFICIENT_STOCK` (row lock).
- Given acceptance with platform freight, then a load is posted with fresh pickup and delivery codes.
- Given an expired order, when I try to accept, then it is marked expired.

## Invariants

- Acceptance reserves stock atomically.
- A rejection always has a reason.

## Acceptance criteria

- [x] `respond_to_order()` and tests
- [ ] Inbox with countdown to expiry
- [ ] Order detail with buyer display name, municipality and rating (no phone until accepted)
