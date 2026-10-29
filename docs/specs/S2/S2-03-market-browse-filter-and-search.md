---
id: S2-03
title: "Market: browse, filter and search"
sprint: 2
milestone: "Sprint 2 · Listings"
labels: [spec, sprint-2, buyer, marketplace]
status: partial
---

# S2-03 · Market: browse, filter and search

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a buyer, I find the product I need near the origin I prefer, at a price I like, fast.

## Behavior

- Given `/market`, then I see published, in-window carguitas, newest first, 20 per page.
- Given filters (product, department/municipality, grade, max price, available from), then they are kept in the URL so the back button and sharing work.
- Given a farmer opens the market, then they see prices but no order button.

## Invariants

- Results come only through RLS (no service role).
- Page size is capped server-side at 50.

## Acceptance criteria

- [x] Basic list with product, municipality, kg, price
- [ ] Filters and pagination
- [ ] Median price per product shown on top
- [ ] Empty state with "create an alert"
