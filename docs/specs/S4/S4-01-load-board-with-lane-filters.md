---
id: S4-01
title: "Load board with lane filters"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, carrier, freight]
status: partial
---

# S4-01 · Load board with lane filters

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a verified carrier, I see posted loads and filter by origin, destination, pickup date, body type and weight, so I can fill my truck on the route I already drive.

## Behavior

- Given an unverified carrier, then the board is empty with a call to verify.
- Given filters, then they're in the URL; results sorted by pickup date.
- Given a load, then I see municipalities, product, kg, body, pickup and deliver-by dates, and target rate if set. Never the farm or address.

## Invariants

- Only `posted` loads are visible to non-parties.
- Exact stops are not in any board query.

## Acceptance criteria

- [x] RLS and basic list
- [ ] Filters, saved lanes
- [ ] Estimated distance between municipalities (centroids)
