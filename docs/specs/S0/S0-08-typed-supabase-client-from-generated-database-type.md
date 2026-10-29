---
id: S0-08
title: "Typed Supabase client from generated database types"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, dx, database]
status: todo
---

# S0-08 · Typed Supabase client from generated database types

**Status:** Not started

## Requirement

As a developer, queries and RPC calls are type-checked against the real schema, so a renamed column breaks the build instead of production.

## Behavior

- Given the local stack, when I run `npm run db:types`, then `src/lib/supabase/database.types.ts` is regenerated.
- Given a query with a wrong column, when I run `npm run typecheck`, then it fails.

## Invariants

- `createClient()` is typed with `Database`.
- CI fails if generated types are out of date with migrations.

## Acceptance criteria

- [ ] Generated types committed
- [ ] `createClient<Database>()`
- [ ] Remove the hand-written row types in pages
- [ ] CI check: regenerate and `git diff --exit-code`
