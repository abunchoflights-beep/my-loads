---
id: S1-05
title: "MFA (TOTP), step-up and sign out everywhere"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, auth, security]
status: todo
---

# S1-05 · MFA (TOTP), step-up and sign out everywhere

**Status:** Not started

## Requirement

As a user, I can protect my account with an authenticator app. As an admin, I must.

## Behavior

- Given `/account/security`, when I enroll TOTP, then I scan a QR, confirm a code and the factor becomes verified.
- Given a verified factor, when I sign in, then I am asked for a code and the session reaches `aal2`.
- Given an admin path and `aal1`, then I'm sent here with `?next=` and returned after the challenge.
- Given "Cerrar sesión en todos los dispositivos", then every refresh token is revoked (`scope: global`).

## Invariants

- Admin RLS and RPCs require `aal2` regardless of UI.
- Unenrolling the last factor requires a fresh `aal2`.

## Acceptance criteria

- [ ] Enroll, challenge, verify, unenroll screens
- [ ] Recovery codes or second factor guidance
- [ ] E2E: admin blocked at aal1, allowed at aal2
