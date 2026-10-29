---
id: S0-06
title: "RLS and RPC test harness (pgTAP) in CI"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, database, security, testing]
status: done
---

# S0-06 · RLS and RPC test harness (pgTAP) in CI

**Status:** Scaffolded in this repo

## Requirement

As the team, we can prove that every policy does what we think, and a refactor that opens a hole fails CI.

## Behavior

- Given the local stack, when I run `npm run db:test`, then all files in `supabase/tests/database` run inside rolled-back transactions.
- Given a test, when it calls `tests.login(uid)`, then queries run as `authenticated` with that user's claims.

## Invariants

- Every new policy or RPC ships with tests for the allowed actor and at least one denied actor.
- Tests never depend on data outside their own transaction.

## Acceptance criteria

- [x] `01_identity_privacy.test.sql`: 18 checks (signup roles, escalation, PII, location privacy, admin MFA, audit)
- [x] `02_order_to_delivery.test.sql`: 30 checks (listing guards, pricing, stock, board visibility, bids, codes, contacts)
- [ ] CI job runs them on every PR
