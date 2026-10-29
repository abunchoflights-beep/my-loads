---
id: S6-02
title: "Buyer pays at acceptance (funds held)"
sprint: 6
milestone: "Sprint 6 · Payments"
labels: [spec, sprint-6, payments]
status: todo
---

# S6-02 · Buyer pays at acceptance (funds held)

**Status:** Not started

## Requirement

As a farmer, I only load the truck when the buyer's money is already held. As a buyer, my money is released only when I get the goods.

## Behavior

- Given an accepted order, then the buyer gets a payment link for subtotal + freight (if platform) + fee, valid 12 h.
- Given payment confirmed by signed webhook, then the order shows "Pagado" and pickup codes become visible.
- Given no payment in 12 h, then the order is cancelled and stock returned.

## Invariants

- Webhook signatures are verified; duplicate events are idempotent.
- Amounts come from the database, never from the client or the webhook body alone.

## Acceptance criteria

- [ ] `payments` table with RLS
- [ ] Webhook route handler with signature check
- [ ] pgTAP + integration tests with provider sandbox
