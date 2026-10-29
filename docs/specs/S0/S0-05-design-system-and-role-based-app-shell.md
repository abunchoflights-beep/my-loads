---
id: S0-05
title: "Design system and role-based app shell"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, ui, design]
status: done
---

# S0-05 · Design system and role-based app shell

**Status:** Scaffolded in this repo

## Requirement

As any user, the app looks and feels like a native iPhone app in dark mode, and I only see the sections that apply to my role.

## Behavior

- Given a farmer on a phone, when they sign in, then they see a bottom tab bar with Inicio, Mis carguitas, Pedidos, Cuenta.
- Given a buyer or carrier, then their own four tabs appear instead (see docs/ROUTES.md).
- Given a desktop viewport, then the same items appear in a left sidebar.
- Given an unverified user, then a banner on every screen links to verification.

## Invariants

- Colors only come from tokens in `globals.css`.
- Touch targets are at least 44 px.
- Only `--label` and `--label-2` are used for content text.

## Acceptance criteria

- [x] Tokens, `Button`, `Group/Row`, `Field`, `StatusPill`, `EmptyState`, `PageHeader`
- [x] `AppShell` with tab bar and sidebar per role
- [x] Landing page
- [ ] Visual regression screenshots in CI for landing, login, signup
