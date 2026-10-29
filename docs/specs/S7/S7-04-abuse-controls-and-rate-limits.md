---
id: S7-04
title: "Abuse controls and rate limits"
sprint: 7
milestone: "Sprint 7 · Trust"
labels: [spec, sprint-7, security]
status: todo
---

# S7-04 · Abuse controls and rate limits

**Status:** Not started

## Requirement

As the platform, we slow down scrapers, spammers and brute-forcers without bothering real users.

## Behavior

- Given more than N market pages per minute from one user, then requests are throttled.
- Given suspicious patterns (many accounts per device, many cancelled orders), then admins get an alert.

## Invariants

- Limits are per user and per IP; logs never store raw IPs (hashed).

## Acceptance criteria

- [ ] Rate limiter in server actions and route handlers
- [ ] Per-RPC limits in Postgres for bids and orders
- [ ] Admin alerts
