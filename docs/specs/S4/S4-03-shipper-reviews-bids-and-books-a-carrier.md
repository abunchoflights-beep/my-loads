---
id: S4-03
title: "Shipper reviews bids and books a carrier"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, buyer, freight]
status: partial
---

# S4-03 · Shipper reviews bids and books a carrier

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As the buyer paying the freight, I compare offers (price, rating, truck) and book one.

## Behavior

- Given bids on my load, then I see amount, carrier rating, truck class/body and message.
- Given I accept one, then the load is booked, the other bids are rejected, the carrier is notified and gets the stops.
- Given two accept clicks race, then only one booking happens (row lock).

## Invariants

- Only the shipper can accept.
- The carrier and vehicle must still be verified at booking time.

## Acceptance criteria

- [x] `accept_bid()` and tests
- [ ] Bids list on the buyer's order screen
- [ ] Target rate editor (`set_load_target_rate`)
