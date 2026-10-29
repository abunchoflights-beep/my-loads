---
id: S5-04
title: "Proof of delivery photos"
sprint: 5
milestone: "Sprint 5 · Trips"
labels: [spec, sprint-5, trips]
status: partial
---

# S5-04 · Proof of delivery photos

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a carrier, I attach photos of the delivered load so disputes have evidence.

## Behavior

- Given a picked-up or delivered load, when I upload photos, then they go to `pod/{load_id}/` and parties can view them.

## Invariants

- Only the booked carrier uploads; only parties and admins read.
- EXIF GPS stripped.

## Acceptance criteria

- [x] Bucket policies
- [ ] Upload UI on trip screen
- [ ] Thumbnails on buyer and farmer order screens
