---
id: S6-05
title: "Platform fee and receipts"
sprint: 6
milestone: "Sprint 6 · Payments"
labels: [spec, sprint-6, payments, legal]
status: todo
---

# S6-05 · Platform fee and receipts

**Status:** Not started

## Requirement

As the business, we charge the agreed commission and give each party a clear receipt.

## Behavior

- Given a completed order, then each party gets a receipt with product subtotal, freight, fee and taxes as applicable.

## Invariants

- Fee rates are configuration, versioned, and snapshotted on each order.

## Acceptance criteria

- [ ] `platform_settings` with fee versions
- [ ] Receipt PDF/email
- [ ] DIAN e-invoicing decision recorded (Q5)

## Notes

Blocked by client answers Q1 and Q5.
