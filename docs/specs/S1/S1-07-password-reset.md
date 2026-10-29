---
id: S1-07
title: "Password reset"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, auth]
status: todo
---

# S1-07 · Password reset

**Status:** Not started

## Requirement

As a user who forgot my password, I can set a new one from my email without support.

## Behavior

- Given `/forgot-password`, when I submit an email, then I always see the same confirmation, whether the account exists or not.
- Given the recovery link, when I open it, then `/auth/confirm` verifies it and sends me to set a new password.
- Given a successful reset, then other sessions are revoked.

## Invariants

- Reset links are single-use and expire in 1 hour.
- New password follows the same policy as signup.

## Acceptance criteria

- [ ] Forgot and reset screens
- [ ] Recovery email template (done) wired to the flow
- [ ] Global sign-out after reset
