---
id: S5-02
title: "Pickup and delivery with one-time codes"
sprint: 5
milestone: "Sprint 5 · Trips"
labels: [spec, sprint-5, trips, security]
status: partial
---

# S5-02 · Pickup and delivery with one-time codes

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As the farmer, I give the carrier my pickup code only when the load is on the truck. As the buyer, I give the delivery code only when I have the goods.

## Behavior

- Given the farmer's order screen during `booked`, then they see the pickup code.
- Given the buyer's order screen during `booked` or `picked_up`, then they see the delivery code.
- Given the carrier enters a wrong code, then they see attempts left; after 5, the load locks and an admin is alerted.
- Given the right pickup code, then the load is `picked_up` and the order `in_transit`.

## Invariants

- Codes are 6 digits from a CSPRNG, stored only in `private.load_secrets`.
- The carrier can never read a code.

## Acceptance criteria

- [x] RPCs, lockout and tests
- [ ] 6-box code input UI
- [ ] Admin unlock RPC and screen
