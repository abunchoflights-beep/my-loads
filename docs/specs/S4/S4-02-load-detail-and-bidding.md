---
id: S4-02
title: "Load detail and bidding"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, carrier, freight]
status: partial
---

# S4-02 · Load detail and bidding

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a carrier, I offer my price for a load with one of my eligible trucks.

## Behavior

- Given my vehicles, then only eligible ones (verified, active, capacity, body, SOAT valid) can be chosen; others show why not.
- Given I bid again, then my active bid's amount is replaced, not duplicated.
- Given I withdraw, then the shipper no longer sees it as active.

## Invariants

- One active bid per carrier per load.
- Bids are visible only to the bidder and the shipper.

## Acceptance criteria

- [x] `place_bid()`, `withdraw_bid()` and tests
- [ ] Detail screen with bid sheet
- [ ] Route preview by municipality, no pin
