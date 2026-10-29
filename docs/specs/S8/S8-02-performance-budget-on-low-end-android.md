---
id: S8-02
title: "Performance budget on low-end Android"
sprint: 8
milestone: "Sprint 8 · Launch"
labels: [spec, sprint-8, performance]
status: todo
---

# S8-02 · Performance budget on low-end Android

**Status:** Not started

## Requirement

As Doña Rosa on a cheap phone, the app opens fast enough that I don't give up.

## Behavior

- Given a Moto E class device on throttled 4G, then LCP under 2.5 s and INP under 200 ms on farmer flows.

## Invariants

- First-load JS under 150 KB gzip for farmer routes; CI fails above budget.

## Acceptance criteria

- [ ] Lighthouse CI with budgets
- [ ] Image optimization for listing photos
- [ ] Bundle analysis
