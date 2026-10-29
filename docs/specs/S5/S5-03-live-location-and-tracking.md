---
id: S5-03
title: "Live location and tracking"
sprint: 5
milestone: "Sprint 5 · Trips"
labels: [spec, sprint-5, trips, realtime]
status: partial
---

# S5-03 · Live location and tracking

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a buyer and farmer, I see where my load is while it travels.

## Behavior

- Given a picked-up load, when the carrier's phone sends location, then `post_location()` stores at most one point per minute.
- Given the buyer's order screen, then the last position and time update live.

## Invariants

- Location is visible only to load parties and admins, only while `picked_up`.
- The browser receives a short-lived, narrowly scoped token for Realtime only (ADR-002 exception).

## Acceptance criteria

- [x] `post_location()` with rate limit
- [ ] Realtime channel with RLS on `shipment_events`
- [ ] CSP `connect-src` adds the Supabase `wss:` origin
- [ ] Background-friendly sending in the PWA
