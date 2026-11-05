---
id: S1-05
title: "MFA (TOTP), step-up and sign out everywhere"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, auth, security]
status: partial
---

# S1-05 · MFA (TOTP), step-up and sign out everywhere

**Status:** Built and tested (pgTAP 05, route tests). Open: E2E admin aal1/aal2 needs the Playwright harness (S0-09), and a demo with a real authenticator app.

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

- [x] Enroll, challenge, verify, unenroll screens
- [x] Recovery codes or second factor guidance
- [ ] E2E: admin blocked at aal1, allowed at aal2

## Technical plan

| Area | Change |
|---|---|
| Data model / migration | `20261105000300_mfa_claim.sql`: `custom_access_token_hook` gains an `mfa_enrolled` claim (the user has at least one verified factor in `auth.mfa_factors`). Like `user_role`, it is for routing only: RLS and RPCs keep reading `aal` from the token and roles from the database. No new tables. |
| RPCs | None. Enroll, challenge, verify and unenroll are Supabase Auth MFA calls (`auth.mfa.*`) made on the server as the user. |
| RLS and grants | Unchanged. pgTAP re-checks the invariant "admin RLS requires `aal2`" on `profile_private` reads. |
| Routes | `/account/security` (any role) is the only MFA screen. When the session is `aal1` and the user has a verified factor, it shows the code challenge. Otherwise it shows management (factors, enroll, remove, sign out everywhere). `resolveAccess()` gets `mfa` on the viewer: signed-in, enrolled and `aal1` on any other app route → `/account/security?next=<path>`. Admin routes at `aal1` keep redirecting there too, to enroll or to verify. `?next=` always goes through `safeNextPath`. ROUTES.md and `access.ts` updated. |
| Auth layer | `src/lib/auth/mfa.ts` (`server-only`): `listTotpFactors()`, `startTotpEnrollment()` (first removes the caller's abandoned unverified factors), `confirmTotpEnrollment(factorId, code)`, `verifyTotp(code)` (tries the user's verified factors), `removeTotpFactor(factorId, code)`, `signOutEverywhere()`. Supabase error codes map to Spanish (`mfa_verification_failed` → "Código incorrecto o vencido."). `getViewer()` reads `mfa_enrolled`. |
| Contracts | `totpCodeSchema` (6 digits, spaces ignored), `factorIdSchema` (uuid), `friendlyNameSchema`. Server Actions in `account/security/actions.ts` return `ActionResult`; challenge and enroll success redirect to `next`. |
| Fresh `aal2` | Removing any factor asks for a current code in the same request (verified right before the unenroll), so the last factor is never removed on a stale `aal2`. Admins cannot remove their last factor (admins must keep MFA). |
| Recovery | Second-factor guidance: the screen recommends enrolling a second authenticator (backup phone) and allows several factors. Supabase's recovery codes are experimental (`auth.experimental.recoveryCodes`), so they're a follow-up, not part of this spec. |
| UI | QR from Supabase as an `<img>` data URI (already allowed by the CSP's `img-src data:`, never injected as markup). Manual key in a `<details>`. 6-digit input with `inputmode="numeric"` and `autocomplete="one-time-code"`. "Cerrar sesión en todos los dispositivos" is a destructive button (POST action → `signOut({ scope: 'global' })` → `/login`). |
| Dependencies | None. |
| Security | TOTP secrets and QR are never logged. Wrong codes count toward Supabase's MFA rate limits. Step-up is enforced by the proxy for enrolled users and by Postgres (`private.is_admin()` needs `aal2`) for admin data, whatever the UI does. |

## Tasks

- [x] 1. Migration: `mfa_enrolled` claim in the access token hook
- [x] 2. pgTAP `05_mfa.test.sql`: claim false/true per verified factor, other users' factors don't count, role and verification claims kept, admin reads need `aal2`
- [x] 3. `npm run db:types`
- [x] 4. `access.ts` step-up rule + unit tests; `getViewer()` reads the claim
- [x] 5. `src/lib/auth/mfa.ts`, schemas + unit tests, Server Actions
- [x] 6. UI: challenge, enroll (QR + code), factor list with remove, sign out everywhere
- [x] 7. Docs: ROUTES, SECURITY §2 (step-up for enrolled users), DESIGN, SPRINTS, this spec

## Notes

- E2E needs the Playwright + Mailpit harness (S0-09, backlog). Until then, `access.test.ts` covers the redirects and pgTAP covers `aal2` in Postgres.
