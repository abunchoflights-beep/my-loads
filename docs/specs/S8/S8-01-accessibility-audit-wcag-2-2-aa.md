---
id: S8-01
title: "Accessibility audit (WCAG 2.2 AA)"
sprint: 8
milestone: "Sprint 8 · Launch"
labels: [spec, sprint-8, a11y]
status: todo
---

# S8-01 · Accessibility audit (WCAG 2.2 AA)

**Status:** Not started

## Requirement

As a user with low vision or using TalkBack, I can complete every main flow.

## Behavior

- Given each main flow (publish, order, bid, trip), then it passes axe checks and a manual TalkBack run.

## Invariants

- No content text below 4.5:1 contrast.

## Acceptance criteria

- [ ] Automated axe in CI
- [ ] Manual audit report and fixes
