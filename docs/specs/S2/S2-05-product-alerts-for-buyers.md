---
id: S2-05
title: "Product alerts for buyers"
sprint: 2
milestone: "Sprint 2 · Listings"
labels: [spec, sprint-2, buyer, notifications]
status: todo
---

# S2-05 · Product alerts for buyers

**Status:** Not started

## Requirement

As a buyer, I get notified when a carguita of a product I follow is published in the departments I care about.

## Behavior

- Given an alert for aguacate-hass in Caldas, when a matching listing is published, then I get an in-app and email notification within 5 minutes.

## Invariants

- At most 1 email per alert per hour (digest).
- Alerts are private to their owner.

## Acceptance criteria

- [ ] `buyer_alerts` table with RLS
- [ ] Trigger to outbox on publish
- [ ] Manage alerts screen

## Notes

Depends on S3-06 outbox.
