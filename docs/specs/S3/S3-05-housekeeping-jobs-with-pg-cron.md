---
id: S3-05
title: "Housekeeping jobs with pg_cron"
sprint: 3
milestone: "Sprint 3 · Orders"
labels: [spec, sprint-3, database, ops]
status: partial
---

# S3-05 · Housekeeping jobs with pg_cron

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As the platform, stale orders expire and past listings close by themselves.

## Behavior

- Given pg_cron, every 15 minutes `private.expire_stale()` expires pending orders past 24 h and listings past `available_until`.

## Invariants

- The job is idempotent.
- It runs as the owner, never exposed to clients.

## Acceptance criteria

- [x] `private.expire_stale()`
- [ ] Migration enabling `pg_cron` and scheduling it
- [ ] pgTAP test for the function
