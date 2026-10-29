---
id: S2-01
title: "Product catalog management"
sprint: 2
milestone: "Sprint 2 · Listings"
labels: [spec, sprint-2, admin, data]
status: partial
---

# S2-01 · Product catalog management

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As operations, I maintain the list of products farmers can sell, with the right default truck body for each.

## Behavior

- Given an MFA admin, when they add or deactivate a product, then it appears or disappears from the publish form and market filters.
- Given a deactivated product, then existing listings keep showing it.

## Invariants

- Products are never deleted, only deactivated.
- Slugs are unique and URL-safe.

## Acceptance criteria

- [x] 18 Colombian products seeded by migration
- [ ] Admin screen to add, rename, deactivate
- [ ] Units hint per product (bulto, canastilla, arroba) for display only; storage stays in kg
