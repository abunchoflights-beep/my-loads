# Project Constitution: Mis Carguitas

Mis Carguitas puts farmers, city buyers and truckers in one place: the farmer sells the harvest directly, the buyer books the truck in the same flow, and the trucker finds loads on their route. It starts in Colombia (see [README](README.md) and [REQUIREMENTS](docs/REQUIREMENTS.md)).

This constitution is binding for every contributor, human or agent (Claude Code, Codex, Cursor, Copilot). Read it before any implementation, refactor, migration or review. When documents disagree, this order wins:

1. This constitution (`AGENTS.md`)
2. [docs/SECURITY.md](docs/SECURITY.md)
3. The issue's spec in `docs/specs/Sx/` and [STATE_MACHINES](docs/specs/STATE_MACHINES.md)
4. [ARCHITECTURE](docs/ARCHITECTURE.md), [ROUTES](docs/ROUTES.md), [DESIGN](docs/DESIGN.md)
5. Existing code

If a rule blocks something you need, change the rule first in its own PR with a reason. Never work around it.

## Product principles

Ranked. When two pull in different directions, the higher one wins.

1. **Trust.** Verified people and trucks, money held until delivery, an audit trail for every lifecycle change.
2. **Safety of people in the field.** Farm coordinates, delivery addresses, phones and live truck location are need-to-know. A leak is a physical-safety incident, not a bug.
3. **Simple enough for Doña Rosa.** A low-end Android, prepaid data, flaky signal, plain Spanish. Publishing a carguita takes under 2 minutes.
4. **Fair price.** The farmer sets the price. We show market prices so they can price well.

## Tech stack

Exact versions live in `package.json` and `package-lock.json`. Upgrades go through Dependabot PRs.

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 22.22.1, npm |
| Web | Next.js 16.4 (App Router, Server Actions, `src/proxy.ts`, Turbopack), React 19.3 |
| Language | TypeScript 5.9, `strict` plus `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch` |
| Styling | Tailwind CSS 4 with the tokens in `src/app/globals.css` |
| Validation | zod 4 |
| Data | Supabase: Postgres 17, Auth (ES256 JWT, TOTP), Storage, through `@supabase/ssr` 0.12 on the server only |
| Toolchain | Vite+ 1.5 (`vp`): Oxfmt (format), Oxlint with tsgolint (lint and type check), Vitest 5 (unit tests), `vp staged` (pre-commit) |
| Database tests | pgTAP through `supabase test db` |
| CI | GitHub Actions: `web` (check, test, migration guard, build) and `database` (schema lint, pgTAP) |

Next.js owns `dev` and `build`. Vite+ owns the static checks and tests. Next.js is not built on Vite, so `vp dev` and `vp build` are not used here.

## Architectural principles

### 1. Backend for frontend: the browser never talks to Supabase

- Data access happens only on the server: Server Components (reads), Server Actions and Route Handlers (writes).
- The only Supabase client is `createClient()` from `src/lib/supabase/server.ts`. It runs as the signed-in user, so RLS applies to every query.
- Runtime imports of `@supabase/*` are allowed only in `src/lib/supabase/` and `src/proxy.ts`. Type-only imports are fine elsewhere on the server.
- `"use client"` modules never import `@supabase/*`, `@/lib/supabase/*`, `@/lib/auth/viewer`, `@/lib/env` or `server-only` code. Fetch on the server and pass plain props.
- No service-role or secret key in this app, ever. Privileged work happens inside a `SECURITY DEFINER` RPC.

### 2. Data access layer per domain

- New queries and mutations live in `src/lib/data/<domain>.ts` (`listings`, `orders`, `loads`, ...), starting with `import "server-only"`. Pages and actions call these functions; they don't build queries inline.
- Each data function takes typed input, selects explicit columns (never `select("*")`), and returns a typed result built from the generated `Database` types (S0-08).
- Existing pages with inline queries move to the data layer when their issue is worked on. Don't add new inline queries.

### 3. The database is the source of truth

- Authorization is enforced by Postgres: RLS for reads, column-level grants for client writes, RPCs for transitions. The proxy and `requireRole()` only keep people out of screens that would be empty for them.
- Lifecycle changes (orders, loads, bids, verification, shipment events) happen only through `SECURITY DEFINER` RPCs with `set search_path = ''`. Each RPC resolves `auth.uid()`, locks the row (`for update`), checks the state and raises a stable error code (`'ORDER_NOT_PENDING'`).
- Clients never `insert/update/upsert/delete` on `orders`, `loads`, `load_bids`, `shipment_events` or `audit_log`.
- New tables: enable RLS, `revoke all ... from anon, authenticated`, then grant exactly what is needed (column-level for updates).
- Migrations are append-only once merged. A fix is a new migration with a later timestamp.

### 4. Contract first

Define the contract before the logic, in this order:

1. **SQL contract:** the RPC signature, its error codes and the pgTAP tests for allowed and denied actors.
2. **Input contract:** a zod schema for every Server Action and Route Handler input (`placeOrderSchema`). Parse with `safeParse` before touching the database.
3. **Output contract:** every Server Action returns `ActionResult<T>` (`{ ok: true; data: T } | { ok: false; error: string; field?: string }`). Route Handlers return explicit status codes: `201` for creates, `204` for no content, `400` for invalid input, `401`/`403` for auth, `404`, `409` for state conflicts. Never `200` with an error body.
4. **UI:** built last, on top of the contracts above.

### 5. Three gates, in order

1. `src/proxy.ts` verifies the JWT and applies `resolveAccess()` from `src/lib/auth/access.ts`.
2. Every page and layout under `src/app/(app)` calls `await requireRole(...)` first.
3. Postgres decides what data comes back (RLS).

Authorize with `getViewer()` / `requireRole()`, built on `getClaims()`. Never `getSession()`. JWT claims are UX hints; RLS reads role and verification from the database.

### 6. Privacy by default

- Listings and loads expose the municipality (5-digit DANE code) only. Exact stops come from `get_load_stops()` to the booked carrier during an active trip.
- Phones come from `get_order_contacts()` to parties of a live order only.
- Never log tokens, cookies, document numbers, phones or coordinates. Strip EXIF (GPS) from every uploaded image.

### 7. Dynamic rendering for the nonce CSP

- Every page renders per request. No `"use cache"`, `generateStaticParams`, `export const revalidate`, `dynamic = "force-static"`, Cache Components or PPR.
- No inline `<script>`, no `next/script`, no `dangerouslySetInnerHTML`, no third-party script or font without a SECURITY.md change first.

## Code standards

### Types

- No `any`. No non-null assertions (`!`). No `@ts-ignore`; `@ts-expect-error` only with a description.
- Untrusted data (form data, search params, JWT claims, JSON, RPC results) is narrowed with zod or a type guard. Never cast it with `as`.
- Exported functions in `src/lib`, Server Actions and Route Handlers declare explicit return types.
- Use `import type` for type-only imports. Prefer `readonly` arrays and `as const` unions over enums.
- Model states as discriminated unions and handle them exhaustively (`switch` with no `default` on unions; the linter checks exhaustiveness).

### Documentation (TSDoc)

- Every module in `src/lib`, `tools` and `scripts` starts with a short comment saying what it is for.
- Every exported function, type and component outside `src/app` has a TSDoc summary. Add `@param`, `@returns` and `@throws` when they aren't obvious from the types:

  ```ts
  /**
   * Places an order against a published listing. Price is snapshotted by the RPC.
   *
   * @param input - Parsed form input (quantity in kg, transport mode, delivery location).
   * @returns The new order id, or a Spanish error message mapped from the RPC code.
   */
  export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult<{ orderId: string }>> {
  ```

- Comments explain why, not what. Link the spec ID or SECURITY section when a line exists because of it.

### Error handling

- RPCs raise stable `UPPER_SNAKE` codes. Server code maps codes to Spanish messages in one place per domain (`src/lib/data/<domain>.ts`) and returns them through `ActionResult`.
- Never send raw database, Supabase or stack-trace text to the client, and never reveal whether another user's record exists. Login and signup errors are identical for every failure.
- Catch at the boundary (Server Action, Route Handler); let `redirect()` and `notFound()` propagate.
- `console.warn` / `console.error` only, never with PII.

### Money, weights, dates

- Money is `bigint` COP computed in SQL. Clients never send totals. Display with `formatCop` (`$ 2.500/kg`).
- Weights are `numeric(12,2)` kg, displayed with `formatKg` (`1.200 kg`).
- Timestamps are `timestamptz`; dates shown as `30 oct` with `formatDay`. Municipalities are DANE codes shown with `municipalityName`.

### UI

- Colors only from the tokens in `src/app/globals.css`: `bg-surface-1`, `text-label-2`, `text-green`, and so on. No Tailwind palette colors, no `white`/`black`, no hex or `rgb()`.
- Build from `src/components/ui` (`Button`, `Group`/`Row`, `Field`, `StatusPill`, `EmptyState`, `PageHeader`). New primitives go there with an entry in DESIGN.md.
- Touch targets at least 44 px. Only `--label` and `--label-2` for content text. Every icon is `aria-hidden` next to text, or has a label.
- Server Components by default. `"use client"` only for interactivity, as small and as low in the tree as possible.
- Every list has an empty state that says what to do next. Check every screen at 390 px wide.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Files and folders | `kebab-case` | `signup-form.tsx`, `safe-redirect.ts` |
| React components, types | `PascalCase` | `AppShell`, `SignedInViewer` |
| Functions, variables | `camelCase` | `requireRole`, `formatCop` |
| Module constants | `UPPER_SNAKE_CASE` | `ROLE_HOME`, `RPC_ONLY_TABLES` |
| zod schemas | `camelCase` + `Schema` | `placeOrderSchema` |
| Inferred input types | `PascalCase` + `Input` | `PlaceOrderInput` |
| Server Actions | verb first | `placeOrder`, `respondToOrder` |
| Tables, columns, RPCs | `snake_case`, RPCs verb first | `load_bids`, `accept_bid()` |
| RPC error codes | `UPPER_SNAKE_CASE` | `ORDER_NOT_PENDING` |
| Migrations | `YYYYMMDDHHMMSS_snake_case.sql` | `20261110000100_listing_photos.sql` |
| Unit tests | `*.test.ts` next to the code or in `src/__tests__` | `access.test.ts` |
| pgTAP tests | `NN_topic.test.sql` | `03_listings.test.sql` |

Code, routes, tables and identifiers in English. UI copy in Spanish (es-CO, tú), with the users' own words: carguita, pedido, flete, finca, vereda.

## Spec-driven development workflow

No code is written before the spec is clear. Every change goes through these five phases, recorded in the issue's spec file `docs/specs/Sx/Sx-yy-*.md` (template: [docs/specs/_TEMPLATE.md](docs/specs/_TEMPLATE.md)).

1. **Specification.** Read or write the spec: Requirement, Behavior (Given/When/Then), Invariants, Acceptance criteria. Inputs, outputs, states and error cases must be explicit. If anything is ambiguous, stop and ask, or add it to the open questions in REQUIREMENTS with the default you propose. Don't guess.
2. **Technical plan.** Add a `## Technical plan` section: data model and migration, RPC signatures and error codes, RLS and grants, routes (with the ROUTES.md and `access.ts` change), data-layer functions, zod schemas, components, new dependencies with a reason, and the security impact (SECURITY.md checklist).
3. **Task breakdown.** Add a `## Tasks` checklist in build order, each task small enough for one commit:
   1. Migration
   2. pgTAP tests for the invariants (allowed actor, denied actors, wrong state)
   3. `npm run db:types`
   4. zod schemas and data-layer functions
   5. Server Actions / Route Handlers
   6. UI (remove the `SpecPlaceholder`)
   7. Unit tests
   8. Docs sync (ROUTES, STATE_MACHINES, DESIGN, spec status)
4. **Implementation.** Work the tasks in order. Write the invariant tests before the code that satisfies them. Keep the diff to what the spec covers; note anything else as a new issue.
5. **Validation.** `npm run check` and `npm run db:test` are green. Each Behavior line was demoed. Every Acceptance box is ticked. If behavior changed while building, update the spec in the same PR.

The Definition of Ready and Definition of Done are in [SPRINTS](docs/SPRINTS.md).

## Enforcement

The rules above are checked by tools. A red check means the work isn't done.

| Rule | Enforced by |
|---|---|
| No Supabase in client code; runtime Supabase imports only in the server client and proxy | lint `constitution/supabase-server-only` |
| Never `getSession()` | lint `constitution/no-get-session` |
| No service-role or secret key | lint `constitution/no-service-role` |
| No client writes to lifecycle tables | lint `constitution/rpc-only-lifecycle`, RLS and grants, pgTAP |
| Every `(app)` page and layout calls `requireRole()` | lint `constitution/require-role` |
| Dynamic rendering only | lint `constitution/dynamic-rendering-only` |
| No inline or third-party scripts | lint `constitution/no-inline-script`, `react/no-danger`, CSP |
| Token colors only | lint `constitution/token-colors-only` |
| Strict types | `vp check` (tsgolint type check), TS compiler flags, `typescript/*` lint rules |
| Formatting | `vp check` (Oxfmt), `vp staged` pre-commit |
| Migrations append-only and ordered | `scripts/check-migrations.mjs` (CI, `npm run check`), Claude Code PreToolUse hook |
| RLS and state machines | pgTAP in CI (`database` job) |
| Route matrix | `src/__tests__/access.test.ts` |

The constitution rules live in `tools/lint/constitution.ts`, with tests in `tools/lint/constitution.test.ts`. Never turn them off, downgrade them to warnings or silence them with `oxlint-disable`. Other rules may be disabled for one line with `// oxlint-disable-next-line <rule> -- <reason>` when the reason is real.

## Commands

```bash
npm run check          # format, lint, type check, unit tests, migration guard (the gate)
npm run check:fix      # format and apply safe lint fixes
npm test               # unit and lint-rule tests (vp test)
npm run db:reset       # rebuild the local database from migrations
npm run db:test        # pgTAP
npm run db:types       # regenerate src/lib/supabase/database.types.ts
```

## Keep in sync

- `src/lib/auth/access.ts` ↔ `docs/ROUTES.md` ↔ `src/components/shell/nav.ts`
- RPCs ↔ `docs/specs/STATE_MACHINES.md`
- Tables and grants ↔ the "Who reads / who writes" table in `docs/ARCHITECTURE.md`
- Tokens in `src/app/globals.css` ↔ `docs/DESIGN.md`
- Spec status ↔ `docs/SPRINTS.md`

## Rules for agents

- Read the spec and this file before editing. Say which spec you are working on.
- Never edit a merged migration, `.env*` files (except `.env.example`), or `supabase/signing_keys.json`.
- Don't add a dependency, third-party origin or new pattern that isn't in the technical plan. Ask first.
- Don't weaken a test, a lint rule, a policy or a grant to make something pass. Fix the code, or stop and explain.
- Run `npm run check` before saying a task is done, and report failures with their output.
- Database changes also need `npm run db:reset && npm run db:test` (Docker). If you can't run them, say so.
- Keep the PR template's security checklist honest.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.
This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->
