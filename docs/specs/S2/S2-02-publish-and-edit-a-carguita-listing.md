---
id: S2-02
title: "Publish and edit a carguita (listing)"
sprint: 2
milestone: "Sprint 2 · Listings"
labels: [spec, sprint-2, farmer, marketplace]
status: partial
---

# S2-02 · Publish and edit a carguita (listing)

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a verified farmer, I publish what I'm harvesting (product, grade, kilos, minimum order, price per kg, dates, photos) in under two minutes from my phone.

## Behavior

- Given the form, when I save as draft, then it's visible only to me.
- Given I publish, then it appears in the market with my farm's municipality, never the farm location.
- Given photos, when I upload, then they're resized to WebP, EXIF (including GPS) is stripped, and stored in `listing-photos/{uid}/`.
- Given accepted orders exist, when I lower the quantity below what's sold, then `LISTING_QUANTITY_BELOW_SOLD`.
- Given I withdraw, then pending orders on it are expired and buyers are notified.

## Invariants

- `available_kg` is server-managed: set to quantity on insert, moved only by deltas and order RPCs.
- `municipality_code` is copied from the farm on every write.
- Only verified farmers can publish; drafts are allowed before verification.
- Max 6 photos, 5 MB each, JPEG/PNG/WebP.

## Acceptance criteria

- [x] Table, guard trigger, RLS and tests
- [ ] Mobile form with kg stepper and price helper showing the market median for that product
- [ ] Photo pipeline with EXIF strip
- [ ] Edit and withdraw screens
