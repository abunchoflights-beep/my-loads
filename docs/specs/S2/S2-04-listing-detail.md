---
id: S2-04
title: "Listing detail"
sprint: 2
milestone: "Sprint 2 · Listings"
labels: [spec, sprint-2, buyer, marketplace]
status: todo
---

# S2-04 · Listing detail

**Status:** Not started

## Requirement

As a buyer, before ordering I see photos, grade, available kilos, dates, the farmer's rating and verification, and the origin municipality.

## Behavior

- Given a valid id, then the detail renders with signed photo URLs (10 min).
- Given an invalid or non-visible id, then 404 (no hint whether it exists).

## Invariants

- The farm's exact location and the farmer's phone never appear on this page.

## Acceptance criteria

- [ ] Detail page
- [ ] Farmer card: display name, municipality, rating, member since, verified badge
- [ ] Order button opens S3-01 sheet
