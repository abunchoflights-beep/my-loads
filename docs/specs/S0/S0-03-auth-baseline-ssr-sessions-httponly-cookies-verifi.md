---
id: S0-03
title: "Auth baseline: SSR sessions, HttpOnly cookies, verified JWTs"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, auth, security]
status: done
---

# S0-03 · Auth baseline: SSR sessions, HttpOnly cookies, verified JWTs

**Status:** Scaffolded in this repo

## Requirement

As a user, my session can't be stolen by a script on the page, and the server never trusts a token it hasn't verified.

## Behavior

- Given a request with an expired access token and a valid refresh token, when it hits `proxy.ts`, then the session is refreshed, the new cookies are set HttpOnly, and the page renders as the user.
- Given a tampered or expired JWT with no valid refresh token, when any server code calls `getViewer()`, then it returns null.
- Given a signed-in user, when a server component needs the user, then it calls `getClaims()` (signature verified against JWKS), never `getSession()`.

## Invariants

- No Supabase client exists in browser code.
- Auth cookies are always `HttpOnly; SameSite=Lax; Path=/` and `Secure` in production.
- Access tokens live 15 minutes, refresh tokens rotate, JWTs are ES256.
- Role and verification claims are for routing only; the database re-checks both.

## Acceptance criteria

- [x] `src/lib/supabase/server.ts` and `src/proxy.ts` use `hardenCookie()`
- [x] `getViewer()` / `requireRole()` built on `getClaims()`
- [x] Custom access token hook adds `user_role` and `verification`
- [ ] E2E test: cookie is not readable from `document.cookie`
