@AGENTS.md

# Mis Carguitas: notes for coding agents

Read `docs/SECURITY.md` before touching auth, migrations, headers or storage. Read the issue's spec in `docs/specs/` before building a feature.

## Hard rules

- No Supabase client in browser code. Data access happens in Server Components, Server Actions and Route Handlers through `src/lib/supabase/server.ts`.
- Authorize on the server with `getViewer()` / `requireRole()` (built on `getClaims()`). Never use `getSession()` for authorization.
- No service-role key in this app.
- New tables: enable RLS, revoke from `anon, authenticated`, grant explicitly (column-level for updates).
- Lifecycle changes (orders, loads, bids, verification) only through `SECURITY DEFINER` RPCs with `search_path = ''`. Add pgTAP tests for the allowed actor and denied actors.
- Migrations are append-only once merged.
- Money is `bigint` COP computed in SQL. Weights are `numeric(12,2)` kg.
- Farm and delivery coordinates, addresses and phones are need-to-know (see SECURITY §3, rules 7 and 8).
- Every page renders dynamically (nonce CSP). Don't enable Cache Components / PPR or add inline scripts.
- UI copy in Spanish (es-CO, tú). Code, routes and tables in English.
- Colors only from the tokens in `src/app/globals.css`.

## Commands

```bash
npm run check      # lint + typecheck + unit tests
npm run db:reset   # rebuild local DB from migrations
npm run db:test    # pgTAP
```

Keep `src/lib/auth/access.ts` and `docs/ROUTES.md` in sync. Keep `docs/specs/STATE_MACHINES.md` in sync with the RPCs.
