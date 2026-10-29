---
id: S5-05
title: "PWA and offline tolerance"
sprint: 5
milestone: "Sprint 5 · Trips"
labels: [spec, sprint-5, pwa, performance]
status: todo
---

# S5-05 · PWA and offline tolerance

**Status:** Not started

## Requirement

As a farmer or carrier with bad signal, the app opens, shows my last data and queues my actions until I'm back online.

## Behavior

- Given no connection, then the app shell and last-seen orders/trips render from cache.
- Given a queued action (for example entering a code), then it is sent when back online and the result shown.

## Invariants

- Queued writes are idempotent (idempotency keys).
- Nothing sensitive (codes, stops, phones) is cached after the trip or order ends.

## Acceptance criteria

- [ ] Web app manifest and service worker (CSP-compatible)
- [ ] Install prompt
- [ ] Offline queue for codes and status actions
