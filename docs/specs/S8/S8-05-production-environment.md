---
id: S8-05
title: "Production environment"
sprint: 8
milestone: "Sprint 8 · Launch"
labels: [spec, sprint-8, infra, ops]
status: todo
---

# S8-05 · Production environment

**Status:** Not started

## Requirement

As the business, production runs in a region near Colombia with backups we have actually restored.

## Behavior

- Given production Supabase (sa-east-1), then PITR is on, signing keys created in the dashboard, SMTP configured, and migrations applied by CI.
- Given a restore drill, then we restore to a staging project and the app works.

## Invariants

- Production secrets only in the hosting env store.
- Migrations reach production only through CI.

## Acceptance criteria

- [ ] Production and staging projects
- [ ] Hosting (Vercel or AWS) with env vars
- [ ] Restore drill documented
