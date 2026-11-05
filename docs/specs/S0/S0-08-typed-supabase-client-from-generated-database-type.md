---
id: S0-08
title: "Typed Supabase client from generated database types"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, dx, database]
status: done
---

# S0-08 · Typed Supabase client from generated database types

**Status:** Done. Types generated in CI and committed; a wrong column fails `npm run typecheck`.

## Requirement

As a developer, queries and RPC calls are type-checked against the real schema, so a renamed column breaks the build instead of production.

## Behavior

- Given the local stack, when I run `npm run db:types`, then `src/lib/supabase/database.types.ts` is regenerated.
- Given a query with a wrong column, when I run `npm run typecheck`, then it fails.

## Invariants

- `createClient()` is typed with `Database`.
- CI fails if generated types are out of date with migrations.

## Acceptance criteria

- [x] Generated types committed
- [x] `createClient<Database>()`
- [x] Remove the hand-written row types in pages
- [x] CI check: regenerate and `git diff --exit-code`

## Technical plan

| Area | Change |
|---|---|
| Data model / migration | None. Types are generated from the migrations already in `supabase/migrations`. |
| Generated types | `npm run db:types` (`supabase gen types typescript --local`) writes `src/lib/supabase/database.types.ts`. Committed, excluded from Oxfmt and lint (generated), still type-checked. Exports `Database`, `Tables`, `Enums`. |
| Client | `createServerClient<Database>()` in `src/lib/supabase/server.ts` and `src/proxy.ts`, so `.from()`, `.select()` and `.rpc()` are checked against the schema. |
| Data layer | New `src/lib/data/` (constitution §2), each file `import "server-only"`: `listings.ts` (`listMarketListings`, `listFarmerListings`, `countPublishedListings`), `orders.ts` (`countPendingOrders`), `loads.ts` (`listPostedLoads`). Explicit columns, explicit return types built from `Tables<...>`. A failed read logs the stable code only (no PII) and throws, so the route's error boundary shows. Shared in `src/lib/data/errors.ts`. |
| Pages | `/farmer`, `/farmer/listings`, `/market`, `/loads` call the data layer. The hand-written `ListingRow`, `MarketRow`, `LoadRow` types and `.returns<...>()` casts are deleted. |
| CI | `database` job, after pgTAP: regenerate types, `git add -N` + `git diff --exit-code` on the file (fails when stale or missing), and upload the generated file as the `database-types` artifact so it can be committed from any machine without Docker. |
| Contracts | No new inputs. |
| UI | No visual change. |
| Dependencies | None. |
| Security | Read-only refactor. Queries still run as the signed-in user through RLS. No new grants. |

## Tasks

- [x] 1. CI: regenerate types, diff check, upload artifact
- [x] 2. Commit the generated `database.types.ts` (from the CI artifact)
- [x] 3. `createServerClient<Database>()` in the server client and the proxy
- [x] 4. `src/lib/data/` for listings, orders and loads; pages call it; hand-written row types removed
- [x] 5. Prove it: a query with a wrong column fails `npm run typecheck`
- [x] 6. Docs: README scripts, ARCHITECTURE layout, SPRINTS status, this spec

## Notes

Types depend on every migration, so specs that add migrations in the same branch (S1-06, S1-02, S1-05) regenerate them too; the CI diff check keeps the file honest.
