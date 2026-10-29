---
id: S1-04
title: "Farms, delivery locations and vehicles"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, onboarding]
status: partial
---

# S1-04 · Farms, delivery locations and vehicles

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a farmer I register my farms; as a buyer, my delivery points; as a carrier, my trucks with their documents.

## Behavior

- Given a farmer, when they add a farm with municipality, vereda, directions and an optional pin, then only they (and MFA admins) can ever read it.
- Given a buyer, when they add a delivery point with address and receiving hours, then it becomes selectable when ordering.
- Given a carrier, when they add a vehicle (plate ABC123, class, body, capacity, SOAT, tecnomecánica), then it is `pending` until an admin approves it.
- Given a carrier edits plate, class, body, capacity or document dates, then the vehicle goes back to `pending`.

## Invariants

- The owner's role must match the asset type (trigger `assert_asset_owner_role`).
- Vehicle plates are unique. Vehicles are never hard-deleted, only deactivated.
- Coordinates are inside Colombia's bounding box.

## Acceptance criteria

- [x] Tables, RLS, guards and tests
- [ ] CRUD screens for the three asset types
- [ ] Pin picker that defaults to the municipality centroid and never shares the pin publicly
- [ ] Expiring-SOAT reminder 15 days before
