---
id: S0-02
title: "Local Supabase on Docker and migration workflow"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, database, infra]
status: done
---

# S0-02 · Local Supabase on Docker and migration workflow

**Status:** Scaffolded in this repo

## Requirement

As a developer, I can run the whole backend locally with one command and get the same schema as production, so migrations are tested before they ship.

## Behavior

- Given Docker is running, when I run `npm run db:start`, then a signing key is created if missing and the local Supabase stack starts with all migrations applied.
- Given a schema change, when I add a timestamped file in `supabase/migrations` and run `npm run db:reset`, then the database is rebuilt from zero with it.
- Given the stack is up, when I run `npm run db:types`, then TypeScript types are regenerated from the live schema.

## Invariants

- Migrations are append-only once merged. Fixes go in a new migration.
- Reference data needed in every environment (product catalog) lives in migrations, not in `seed.sql`.
- `supabase/signing_keys.json` never enters git.

## Acceptance criteria

- [x] `supabase/config.toml` committed with hardened auth settings
- [x] Migrations 0100 to 0600 apply cleanly on an empty database
- [x] `db:start`, `db:reset`, `db:test`, `db:lint`, `db:types`, `db:keys` scripts
- [ ] `supabase/seed.sql` with demo users for each role (local only)
