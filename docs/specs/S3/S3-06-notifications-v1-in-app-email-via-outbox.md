---
id: S3-06
title: "Notifications v1 (in-app + email) via outbox"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, notifications, infra]
status: todo
---

# S3-06 · Notifications v1 (in-app + email) via outbox

**Status:** Not started

## Requirement

As any party, I find out right away when something needs me: a new order, an acceptance, a bid, a booking, a pickup, a delivery.

## Behavior

- Given an RPC that changes state, then it writes a row in `notification_outbox` in the same transaction.
- Given a worker, then it sends the email and creates the in-app notification, retrying with backoff.
- Given the bell icon, then I see unread notifications and can mark them read.

## Invariants

- A failed email never rolls back the business transaction.
- Notifications contain no phone numbers or exact locations.

## Acceptance criteria

- [ ] Outbox + notifications tables with RLS
- [ ] Worker (Supabase Edge Function or cron)
- [ ] Email templates in Spanish
- [ ] WhatsApp channel evaluated (Meta Cloud API) as follow-up
