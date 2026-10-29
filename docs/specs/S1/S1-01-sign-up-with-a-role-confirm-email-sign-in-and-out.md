---
id: S1-01
title: "Sign up with a role, confirm email, sign in and out"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, auth, onboarding]
status: partial
---

# S1-01 · Sign up with a role, confirm email, sign in and out

**Status:** Partially scaffolded (database layer done, UI pending)

## Requirement

As a farmer, buyer or carrier, I create an account by saying what I do, confirm my email, and land in the part of the app made for me.

## Behavior

- Given the signup form, when I pick Produzco/Compro/Transporto and submit valid data, then I get a confirmation email and see "Te enviamos un correo".
- Given the email link, when I open it, then `/auth/confirm` verifies the token server-side and sends me to my role home.
- Given someone tampers the role to `admin` in the request, then signup fails with `SIGNUP_ROLE_INVALID`.
- Given wrong credentials, then login says "Correo o contraseña incorrectos" without revealing whether the email exists.
- Given I tap Cerrar sesión, then a POST ends the session and I land on `/login`.

## Invariants

- Exactly one `profiles` row per auth user, created by trigger, with role in farmer/buyer/carrier.
- The role can never be changed by the user.
- Signup and login responses do not leak account existence.

## Acceptance criteria

- [x] Signup and login server actions with zod validation
- [x] `handle_new_user` trigger and tests
- [x] Token-hash email templates and `/auth/confirm`
- [ ] Resend confirmation email (rate limited)
- [ ] E2E test of the full flow against local Supabase (Inbucket/Mailpit)
