---
id: S1-06
title: "DANE municipalities table and picker"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, data, ui]
status: todo
---

# S1-06 · DANE municipalities table and picker

**Status:** Not started

## Requirement

As any user, I pick my municipality from a searchable list instead of typing it, and everyone sees the same names.

## Behavior

- Given the picker, when I type "apar", then "Apartadó, Antioquia" appears.
- Given a code stored anywhere, then the UI shows the official name.

## Invariants

- All `municipality_code` columns reference `municipalities(code)` (FK added in the same migration).
- Source: DANE DIVIPOLA, version recorded in the migration.

## Acceptance criteria

- [ ] `municipalities` table (code, name, department_code, department_name, centroid lat/lng) loaded by migration
- [ ] Replace `src/lib/format/municipalities.ts` with DB lookups
- [ ] Accent-insensitive search
