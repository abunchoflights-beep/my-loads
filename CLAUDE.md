@AGENTS.md

# Claude Code notes

`AGENTS.md` above is the project constitution. Everything in it applies to you. This file only adds what is specific to Claude Code.

## Before you start

1. Name the spec you are working on (`docs/specs/Sx/Sx-yy-*.md`). No spec, no code: write or update the spec first and get it approved.
2. Read `docs/SECURITY.md` before touching auth, migrations, headers or storage.
3. For anything bigger than a small fix, write the Technical plan and Tasks sections in the spec before editing code.

## Hooks in `.claude/settings.json`

These run on every session in this repo. Work with them, never around them.

| Hook | When | What it does |
|---|---|---|
| `guard-files.mjs` | Before Edit/Write | Denies edits to migrations already on `origin/main` and to `.env*` files. Create a new migration instead; ask the user to set secrets. |
| `lint-file.mjs` | After Edit/Write | Formats the file with Oxfmt, then lints and type-checks it with the constitution rules. Fix what it reports before moving on. |
| `verify.mjs` | When you stop | If code changed, runs `npm run check` and blocks until it is green. |

If a hook blocks you and you believe the rule is wrong, stop and explain to the user. Don't disable hooks, edit `.claude/settings.json` or add `oxlint-disable` for constitution rules to get past one.

## Working style

- Small, linear steps that follow the spec's task list. Commit messages reference the spec ID (`feat(S2-02): ...`).
- Docker may be missing in cloud sessions. When you can't run `npm run db:test`, say so plainly instead of claiming the database work is verified.
- `backlog.md` at the repo root is a local planning file (gitignored). Read it for sprint context; don't commit it.
