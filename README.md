# Mis Carguitas · My Loads

Farmers sell their harvest directly to markets and businesses in the cities, and the buyer books the truck in the same place. A marketplace plus a DAT-style load board, starting in Colombia.

> De la finca al mercado. Sin intermediarios.

**Status:** Sprint 0 scaffold. The database (schema, RLS, state machines) and the security layer are built and tested. Most screens are placeholders linked to their spec issue.

## How it works

1. **Farmer** publishes a *carguita*: product, kilos, price per kg, dates.
2. **Buyer** orders part or all of it and picks how it travels.
3. **Farmer** accepts. If the buyer chose platform freight, a *flete* is posted on the load board.
4. **Carriers** bid. The buyer books one.
5. **Pickup**: the farmer reads a 6-digit code to the carrier. **Delivery**: the buyer reads another one. Both work over a phone call with no data signal.
6. Buyer confirms receipt. Payments (S6) hold the money until this point.

Exact farm locations, delivery addresses and phone numbers are private until there is a confirmed deal. In rural Colombia, that is a safety requirement.

## Stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, Tailwind 4, TypeScript |
| Data | Supabase: Postgres 17, Auth (ES256 JWT, TOTP), Storage. Local stack on Docker |
| Security | Nonce CSP, HttpOnly cookies, no browser Supabase client, RLS + RPC-only state changes |
| Tests | Vitest (unit), pgTAP (RLS and state machines) |
| Later | AWS (RDS/Aurora + S3) when we outgrow Supabase. See [ARCHITECTURE](docs/ARCHITECTURE.md), ADR-001 |

## Quick start

Prerequisites: Node 22+, Docker running, Git.

```bash
npm install
```

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
| `npm run check` | lint + typecheck + unit tests |
| `npm test` | Vitest unit tests (CSP, route access, safe redirects) |
| `npm run db:start` / `db:stop` | Local Supabase on Docker |
| `npm run db:reset` | Rebuild the database from migrations |
| `npm run db:test` | pgTAP tests in `supabase/tests/database` |
| `npm run db:lint` | Supabase schema linter |
| `npm run db:types` | Regenerate TypeScript types from the local schema |
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
src/proxy.ts              CSP nonce, session refresh, route gate
src/app/(auth)            login, signup
src/app/(app)             farmer/, market/, buyer/, loads/, trips/, vehicles/, account/, admin/
src/lib/auth              route matrix, getViewer / requireRole
src/lib/security          CSP, cookies, safe redirects
supabase/migrations       schema, RLS, RPCs, audit, storage, catalog
supabase/tests/database   pgTAP
docs/                     everything below
```

## Docs

| Doc | For |
|---|---|
| [REQUIREMENTS](docs/REQUIREMENTS.md) | Client needs, personas, functional and non-functional requirements, glossary, open questions |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System diagram, data model, who reads/writes what, ADRs |
| [SECURITY](docs/SECURITY.md) | Threat model, JWT and session rules, RLS rules, CSP, storage, secrets |
| [ROUTES](docs/ROUTES.md) | Every route, who can see it, navigation per role, main flows |
| [DESIGN](docs/DESIGN.md) | Apple-style dark design system: tokens, type, components, copy |
| [STATE_MACHINES](docs/specs/STATE_MACHINES.md) | Order, listing, load, bid, verification lifecycles |
| [SPRINTS](docs/SPRINTS.md) | 9 sprints, 52 spec issues with requirement, behavior, invariants and acceptance criteria |

## Working spec-first

1. Pick an issue from the current sprint. Its spec lives in `docs/specs/Sx/`.
2. Write the invariants as tests first: pgTAP for the database, Vitest for code.
3. Build until the behavior section can be demoed.
4. Open a PR with the template. CI must be green: lint, types, unit tests, build, schema lint, pgTAP.
5. If the behavior changed while building, update the spec in the same PR.

## Link to GitHub

From this folder, with the [GitHub CLI](https://cli.github.com) logged in (`gh auth login`):

```bash
git init -b main
```

```bash
git add . && git commit -m "chore: scaffold Mis Carguitas"
```

```bash
gh repo create mis-carguitas --private --source=. --remote=origin --push
```

If you already created the empty repo on github.com, replace the last step with:

```bash
git remote add origin git@github.com:<your-user>/mis-carguitas.git
```

```bash
git push -u origin main
```

Then, once:

```bash
npm run gh:issues
```

1. **Settings → Branches**: protect `main`, require PR review and the `web` and `database` checks, block force pushes.
2. **Settings → Code security**: enable Dependabot alerts, secret scanning and push protection.
3. **Settings → Actions → General**: workflow permissions "Read repository contents".
4. Replace `OWNER/REPO` in `.github/ISSUE_TEMPLATE/config.yml`.
