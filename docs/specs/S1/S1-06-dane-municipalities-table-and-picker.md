---
id: S1-06
title: "DANE municipalities table and picker"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, data, ui]
status: in-progress
---

# S1-06 · DANE municipalities table and picker

**Status:** In progress

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

## Technical plan

| Area | Change |
|---|---|
| Data model / migration | `20261105000100_municipalities.sql`: `public.municipalities(code text pk ^[0-9]{5}$, name, department_code ^[0-9]{2}$, department_name, kind municipio\|isla\|area_no_municipalizada, centroid_lat numeric(9,6), centroid_lng numeric(9,6), search_name generated from name)`. 1,122 rows inserted by the migration. `private.normalize_search(text)` (immutable): strips accents and punctuation, lower-cases, so "Apartadó" and "APARTADO" both become `apartado`. |
| Source | DANE DIVIPOLA "Códigos municipios" (datos.gov.co `gdxc-w37w`), via `@colombia-kit/divipola` 0.1.1 (checked monthly against DANE), retrieved 2026-11-05. CC BY-SA 4.0: attribution in the migration header, ARCHITECTURE and the legal page (S0-07). |
| Foreign keys | Same migration: `profiles`, `farms`, `delivery_locations`, `listings` and `loads` (origin and destination) `municipality_code` → `municipalities(code)`, with named constraints so queries can embed each one (`loads_origin_municipality_fk`, `loads_destination_municipality_fk`). |
| RPCs | `search_municipalities(p_query text, p_limit int default 20) returns setof municipalities`, `stable`, security invoker, `search_path = ''`. Normalizes the query, needs at least 2 characters, ranks exact > prefix > word prefix > contains, then by name, caps the limit at 50. No error codes: a short query returns no rows. |
| RLS and grants | RLS on; `revoke all` from anon and authenticated; `grant select` to anon and authenticated with a `using (true)` read policy (reference data, also needed by public pages later). No client writes. `execute` on the search RPC for authenticated only (it calls a `private` helper, and anon has no access to schema `private`). |
| Routes | `GET /api/municipalities?q=` (signed-in, any role): 200 with `{ code, name, departmentName }[]`, 400 when `q` is not 2–40 characters. Added to `access.ts` and ROUTES.md. |
| Data layer | `src/lib/data/municipalities.ts`: `searchMunicipalities(q)`. Names elsewhere come from FK embeds in the existing queries (`municipality:municipalities(name, department_name)`), so no extra lookups. `src/lib/data/profiles.ts`: `getMyProfile()`, `updateMyMunicipality(code)`. |
| Contracts | `municipalitySearchSchema` (q), `updateMunicipalitySchema` (5-digit code). `updateMunicipality` Server Action returns `ActionResult`; an unknown code (FK `23503`) maps to "Elige un municipio de la lista." |
| UI | `MunicipalityPicker` in `src/components/ui` (client): ARIA combobox with listbox, 200 ms debounce, keyboard (↑ ↓ Enter Esc), hidden input with the code. First used on `/account` as "Tu municipio". `formatMunicipality()` in `src/lib/format` replaces `src/lib/format/municipalities.ts` ("Apartadó, Antioquia"; "Bogotá, D.C." once). |
| Dependencies | None. The dataset is inlined in the migration; the npm package is not installed. |
| Security | Reference data, no PII. The search input is normalized to `[a-z0-9 ]` before `LIKE`, so it can't inject wildcards. The route sits behind sign-in to avoid feeding scrapers (SECURITY §1). |

## Tasks

- [ ] 1. Migration: table, normalize function, data, search RPC, grants, FKs
- [ ] 2. pgTAP `03_municipalities.test.sql`: row count, accent-insensitive search and ranking, anon/authenticated read, no client writes, FK rejects unknown codes
- [ ] 3. `npm run db:types`
- [ ] 4. Data layer + schemas; market and load board use FK embeds; delete `src/lib/format/municipalities.ts`
- [ ] 5. `GET /api/municipalities` route handler + access rule
- [ ] 6. `MunicipalityPicker` + "Tu municipio" on `/account` with `updateMunicipality`
- [ ] 7. Unit tests: `formatMunicipality`, search schema, route access
- [ ] 8. Docs: ROUTES, DESIGN (picker), ARCHITECTURE (table, attribution), SPRINTS, this spec

## Notes

- The S1-04 farm, delivery point and vehicle forms reuse the picker.
- Licensing: DIVIPOLA is CC BY-SA 4.0. Attribution is required, and the municipality table we redistribute stays under the same license. App code keeps Apache-2.0.
