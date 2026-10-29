---
id: S3-04
title: "Reveal contacts for live orders"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, orders, privacy]
status: partial
---

# S3-04 · Reveal contacts for live orders

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a party to an accepted order, I can call the other people involved, and nobody else can.

## Behavior

- Given an accepted, in-transit or delivered order, when a party calls `get_order_contacts()`, then they get the other parties' display name and phone.
- Given a losing carrier or any outsider, then `CONTACTS_NOT_AVAILABLE`.
- Given a completed order, then phones are no longer returned.

## Invariants

- Phones are never readable through tables by non-owners.

## Acceptance criteria

- [x] RPC and tests
- [ ] "Llamar" and "WhatsApp" buttons on the order screen (wa.me deep link)
