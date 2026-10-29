---
id: S0-01
title: "Repository, CI and branch protection"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, infra, security]
status: partial
---

# S0-01 · Repository, CI and branch protection

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As the team, we need every change to go through a PR with green checks, so nobody ships a broken migration or a weaker policy by accident.

## Behavior

- Given a PR to `main`, when CI runs, then it executes lint, typecheck, unit tests, build, `supabase db lint` and the pgTAP suite against a fresh local stack.
- Given any check fails, when someone tries to merge, then GitHub blocks it.
- Given a weekly schedule, when Dependabot runs, then it opens PRs for npm and GitHub Actions updates.

## Invariants

- `main` only changes through PRs with at least one approval and green CI.
- Workflows run with `permissions: contents: read` unless a job needs more.
- Third-party actions are pinned to a full commit SHA.

## Acceptance criteria

- [x] `.github/workflows/ci.yml` with web and database jobs
- [x] `.github/dependabot.yml` for npm and actions
- [x] PR template with the security checklist
- [ ] Branch protection on `main`: required checks `web` and `database`, 1 review, no force pushes
- [ ] Actions pinned by SHA
- [ ] Secret scanning and push protection enabled

## Notes

Depends on the GitHub repo existing. See README, section "Link to GitHub".
