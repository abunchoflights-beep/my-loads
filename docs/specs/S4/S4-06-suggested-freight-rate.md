---
id: S4-06
title: "Suggested freight rate"
sprint: 4
milestone: "Sprint 4 · Load board"
labels: [spec, sprint-4, freight, pricing]
status: todo
---

# S4-06 · Suggested freight rate

**Status:** Not started

## Requirement

As a buyer, I get a fair suggested freight rate so I don't overpay or scare carriers off; as a carrier, I see if a target is reasonable.

## Behavior

- Given origin, destination, weight and body, then the system suggests a COP range from distance and recent booked rates on similar lanes.

## Invariants

- The suggestion is advisory; it never blocks a bid.

## Acceptance criteria

- [ ] Distance from municipality centroids (PostGIS)
- [ ] Rate history view by lane
- [ ] Shown on load posting and bidding
