---
id: S7-01
title: "Ratings"
sprint: 7
milestone: "Sprint 7 · Trust"
labels: [spec, sprint-7, trust]
status: todo
---

# S7-01 · Ratings

**Status:** Not started

## Requirement

As anyone who completed a deal, I rate the people I worked with so the next person knows who to trust.

## Behavior

- Given a completed order, then buyer and farmer rate each other, and both rate the carrier (1 to 5 + optional comment) within 14 days.
- Given a rating, then the ratee's average updates.

## Invariants

- One rating per rater, per order, per ratee.
- Ratings can't be edited after 24 h.
- Only parties of a completed order can rate.

## Acceptance criteria

- [ ] `ratings` table, RPC and trigger updating `profiles.rating_avg/count`
- [ ] Rating sheet
- [ ] Reliability score for carriers including unbooks
