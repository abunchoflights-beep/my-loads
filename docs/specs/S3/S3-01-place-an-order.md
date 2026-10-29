---
id: S3-01
title: "Place an order"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, buyer, orders]
status: partial
---

# S3-01 · Place an order

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a verified buyer, I order part or all of a carguita, choose how it travels, and know exactly what I'll pay for the product.

## Behavior

- Given the order sheet, when I set kilos between the minimum and what's available, choose transport (platform, I pick up, farmer delivers) and a delivery point, then `place_order()` creates a pending order.
- Given the subtotal shown, then it equals kilos x the listing price at that moment, computed by the server.
- Given I already have a pending order on that carguita, then `ORDER_ALREADY_PENDING`.
- Given a double tap on submit, then only one order is created.

## Invariants

- Clients cannot insert orders directly.
- Price is snapshotted; later listing edits never change an existing order.
- Pending orders don't reserve stock.

## Acceptance criteria

- [x] `place_order()` and tests
- [ ] Bottom sheet UI with kg stepper and live subtotal
- [ ] Idempotency key on the server action
