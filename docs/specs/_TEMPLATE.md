---
id: Sx-yy
title: "Short title in English"
sprint: x
milestone: "Sprint x · Name"
labels: [spec, sprint-x]
status: todo # todo | planned | in-progress | partial | done
---

# Sx-yy · Short title

<!--
Spec-driven workflow (AGENTS.md): fill the phases in order.
Phase 1 must be approved before Phase 2. Phases 2 and 3 must be written before any code.
-->

## Requirement

As a <farmer | buyer | carrier | admin>, I <need>, so that <why>.

## Behavior

- Given …, when …, then …
- Given … (error case), when …, then `ERROR_CODE` and the user sees "…".

## Invariants

<!-- What must stay true no matter what. Each one becomes a pgTAP or unit test. -->

- …

## Acceptance criteria

- [ ] …

## Technical plan

<!-- Phase 2. Write it before any code. Delete the rows that don't apply. -->

| Area | Change |
|---|---|
| Data model / migration | Tables, columns, constraints, indexes. New file `YYYYMMDDHHMMSS_name.sql`. |
| RPCs | `fn_name(args) returns …`, actor, guards, row locks, error codes. |
| RLS and grants | Policies and column grants added or changed. |
| Routes | Paths and roles, with the `docs/ROUTES.md` and `src/lib/auth/access.ts` change. |
| Data layer | Functions in `src/lib/data/<domain>.ts` and the columns they select. |
| Contracts | zod schemas (`xxxSchema`) and `ActionResult<T>` payloads. |
| UI | Screens, components from `src/components/ui`, empty and error states, Spanish copy. |
| Dependencies | New packages or origins, with a reason. Usually none. |
| Security | Answers to the PR template's security checklist. What could leak and why it doesn't. |

## Tasks

<!-- Phase 3. In build order, one commit each. Tick them as you go. -->

- [ ] 1. Migration
- [ ] 2. pgTAP: allowed actor, each denied actor, wrong state
- [ ] 3. `npm run db:types`
- [ ] 4. zod schemas and data-layer functions
- [ ] 5. Server Actions / Route Handlers
- [ ] 6. UI (remove the `SpecPlaceholder`)
- [ ] 7. Unit tests
- [ ] 8. Docs sync: ROUTES, STATE_MACHINES, DESIGN, this spec's status, SPRINTS

## Notes

Dependencies, open questions (with the default we'll build with), out of scope.
