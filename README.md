# Mis Carguitas · My Loads

One place for the people who move food from the farm to the city. Farmers sell their harvest directly to markets and businesses in the cities, buyers get the freight solved in the same order, and truckers find loads on their route and get paid on delivery. A marketplace plus a DAT-style load board, starting in Colombia.

> De la finca al mercado. Sin intermediarios.

**Status:** Sprint 0 (Foundations). The database (schema, RLS, state machines), the security layer and the toolchain are built and tested. Most screens are placeholders linked to their spec. See [SPRINTS](docs/SPRINTS.md).

## Who it's for

| | Today | With Mis Carguitas |
|---|---|---|
| **Productor** (farmer) | Sells to the same intermediary at a farm-gate price they can't negotiate. | Publishes a *carguita* with their own price and sells straight to a city buyer. |
| **Comprador** (buyer) | Buys from a wholesaler who bought from another wholesaler. | Sees real farm prices, buys, and books the truck in the same flow. |
| **Transportador** (trucker) | Finds loads in WhatsApp groups, drives back empty, gets paid weeks late. | Sees farm-to-city loads on their lane, bids, and is paid when the delivery code is confirmed. |

## How it works

1. **Farmer** publishes a *carguita*: product, kilos, price per kg, dates.
2. **Buyer** orders part or all of it and picks how it travels.
3. **Farmer** accepts. If the buyer chose platform freight, a *flete* is posted on the load board.
4. **Carriers** bid. The buyer books one.
5. **Pickup**: the farmer reads a 6-digit code to the carrier. **Delivery**: the buyer reads another one. Both work over a phone call with no data signal.
6. Buyer confirms receipt. Payments (S6) hold the money until this point.

Exact farm locations, delivery addresses and phone numbers stay private until there is a confirmed deal. In rural Colombia, that is a safety requirement.

## How we build it

Read [AGENTS.md](AGENTS.md) first. It is the **project constitution**: architecture rules, code standards and the spec-driven workflow that every change follows, for people and coding agents alike.

1. **Specify.** Every change starts from a spec in `docs/specs/Sx/` (Requirement, Behavior, Invariants, Acceptance).
2. **Plan.** Add a Technical plan to the spec: data model, RPCs, RLS, routes, contracts, security impact.
3. **Break down.** Add a task list in build order: migration, pgTAP, types, data layer, actions, UI, tests, docs.
4. **Implement** the tasks in order, invariant tests first.
5. **Validate.** `npm run check` and `npm run db:test` green, behavior demoed, spec updated.

The rules are enforced by tools, not by memory. Custom Oxlint rules in `tools/lint/constitution.ts` fail the build on a browser Supabase import, `getSession()`, a client write to a lifecycle table, a missing `requireRole()`, static rendering, inline scripts or raw colors. `scripts/check-migrations.mjs` keeps migrations append-only. Claude Code hooks in `.claude/settings.json` apply the same gates while an agent is coding.

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, Tailwind 4, TypeScript (strict) |
| Data | Supabase: Postgres 17, Auth (ES256 JWT, TOTP), Storage. Local stack on Docker |
| Security | Nonce CSP, HttpOnly cookies, no browser Supabase client, RLS + RPC-only state changes |
| Toolchain | [Vite+](https://viteplus.dev) (`vp`): Oxfmt, Oxlint with type-aware rules and type checking, Vitest |
| Tests | Vitest (unit and lint rules), pgTAP (RLS and state machines) |
| Later | AWS (RDS/Aurora + S3) when we outgrow Supabase. See [ARCHITECTURE](docs/ARCHITECTURE.md), ADR-001 |

**Why Vite+ instead of ESLint + Prettier:** one command (`vp check`) formats, lints and type-checks the repo in about 2 seconds, so it can run on every save, every commit and every agent edit. Oxlint ships the Next.js, React, jsx-a11y and TypeScript rules we used from `eslint-config-next`, and its JS plugin API carries our constitution rules. Next.js still runs `dev` and `build`; Vite+ only replaces the checks.

## Quick start

Prerequisites: Node 22.22.1+, Docker running, Git.

```bash
npm install
```

`npm install` also installs the pre-commit hook (`vp staged`).

```bash
npm run db:start
```

That creates a local ES256 signing key (gitignored), boots Supabase in Docker and applies every migration. It prints the API URL and a **Publishable key**.

```bash
cp .env.example .env.local
```

Paste the publishable key into `.env.local`, then:

```bash
npm run dev
```

Open http://localhost:3000. Confirmation emails land in Mailpit at http://127.0.0.1:54324.

To make yourself admin after signing up:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v email=you@example.com -f scripts/make-admin.sql
```

Then enroll TOTP at `/account/security` (admin screens require MFA).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | **The gate.** Route types, then `vp check` (format, lint with constitution rules, type check), `vp test`, migration guard |
| `npm run check:fix` | Format and apply safe lint fixes |
| `npm run lint` / `fmt` / `typecheck` | One part of `vp check` at a time |
| `npm test` / `test:watch` | Vitest: CSP, route access, safe redirects, constitution lint rules |
| `npm run db:start` / `db:stop` | Local Supabase on Docker |
| `npm run db:reset` | Rebuild the database from migrations |
| `npm run db:test` | pgTAP tests in `supabase/tests/database` |
| `npm run db:lint` | Supabase schema linter |
| `npm run db:types` | Regenerate TypeScript types from the local schema |
| `npm run db:check-migrations` | Fail if a merged migration changed or a new one is misnamed |
| `npm run db:keys` | Create `supabase/signing_keys.json` if missing |
| `npm run gh:issues` | Create GitHub milestones, labels and issues from `docs/specs` |

## Environment

All server-only. The browser never talks to Supabase.

| Variable | Example |
|---|---|
| `SUPABASE_URL` | `http://127.0.0.1:54321` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` from `supabase start`. Never the secret key. |
| `SITE_URL` | `http://localhost:3000` |

## Project layout

```
AGENTS.md                 project constitution (CLAUDE.md imports it)
src/proxy.ts              CSP nonce, session refresh, route gate
src/app/(auth)            login, signup
src/app/(app)             farmer/, market/, buyer/, loads/, trips/, vehicles/, account/, admin/
src/lib/auth              route matrix, getViewer / requireRole
src/lib/security          CSP, cookies, safe redirects
supabase/migrations       schema, RLS, RPCs, audit, storage, catalog (append-only)
supabase/tests/database   pgTAP
tools/lint                constitution lint rules (Oxlint JS plugin) and their tests
vite.config.mts           Vite+ config: fmt, lint, test, staged
.claude/                  Claude Code hooks that enforce the constitution
docs/                     everything below
```

## Docs

| Doc | For |
|---|---|
| [AGENTS](AGENTS.md) | The constitution: principles, standards, SDD workflow, enforcement |
| [REQUIREMENTS](docs/REQUIREMENTS.md) | Client needs, personas, functional and non-functional requirements, glossary, open questions |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System diagram, data model, who reads/writes what, ADRs |
| [SECURITY](docs/SECURITY.md) | Threat model, JWT and session rules, RLS rules, CSP, storage, secrets |
| [ROUTES](docs/ROUTES.md) | Every route, who can see it, navigation per role, main flows |
| [DESIGN](docs/DESIGN.md) | Apple-style dark design system: tokens, type, components, copy |
| [STATE_MACHINES](docs/specs/STATE_MACHINES.md) | Order, listing, load, bid, verification lifecycles |
| [SPRINTS](docs/SPRINTS.md) | 9 sprints, 52 spec issues, Definition of Ready and Done |
| [Spec template](docs/specs/_TEMPLATE.md) | Requirement, Behavior, Invariants, Acceptance, Technical plan, Tasks |

## Repository setup (one time)

The repository is [abunchoflights-beep/my-loads](https://github.com/abunchoflights-beep/my-loads). With the [GitHub CLI](https://cli.github.com) logged in, create the milestones, labels and issues from the specs:

```bash
npm run gh:issues
```

Then, in the repository settings:

1. **Branches**: protect `main`. Require a PR with one review, require the `web` and `database` checks, block force pushes.
2. **Code security**: enable Dependabot alerts, secret scanning and push protection.
3. **Actions → General**: workflow permissions "Read repository contents".
4. Pin the GitHub Actions in `.github/workflows/ci.yml` to commit SHAs (S0-01).

## License

[Apache-2.0](LICENSE)
