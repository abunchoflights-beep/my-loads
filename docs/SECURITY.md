# Security

This is the rulebook. Every PR that touches auth, the database, headers or file storage is reviewed against it. If a rule here blocks something you need, change the rule in a PR first, with a reason.

## 1. Threat model

What we protect, ranked by how bad a leak would be:

1. **Physical safety of people.** Farm coordinates, delivery addresses, phone numbers and live truck location. In Colombia, a public farm pin plus a phone number is an extortion kit, and knowing which truck carries what and when is how cargo gets stolen.
2. **Money.** Order prices, freight rates, and later, payment holds and payouts.
3. **Identity data.** Cédula/NIT numbers, legal names, KYC files.
4. **Market data.** Bulk scraping of listings by the same intermediaries we are cutting out.

Who attacks us and how:

| Actor | Likely attack | Main controls |
|---|---|---|
| Curious or greedy user | Edits requests to change a price, approve themselves, read other people's orders | RPC-only writes, server-side pricing, column grants, RLS, guard triggers (§3) |
| Fake carrier | Signs up to see where loads are and steal them | Verification before seeing the board, municipality-only data until booking, codes for handoff, audit log |
| Account takeover | Credential stuffing, phishing, stolen session | 12-char passwords, email confirmation, short JWTs + rotating refresh tokens, HttpOnly cookies, MFA (mandatory for admin) |
| XSS / injection | Script in a listing description, malicious upload | Nonce CSP with `strict-dynamic`, React escaping, no `dangerouslySetInnerHTML`, MIME allowlists on buckets, parameterized queries only |
| Scraper | Enumerates listings and prices | Market requires sign-in, pagination limits, rate limits (S7-04) |
| Insider / admin mistake | Over-broad reads, accidental changes | MFA for admin, admin reads through RLS too, immutable audit log |
| Supply chain | Malicious npm package or GitHub Action | Lockfile, `npm ci`, Dependabot, pinned actions (S0-01) |

## 2. Sessions and JWT rules

The app uses a **backend-for-frontend** model: the browser never talks to Supabase. Server components, server actions and route handlers do, using the user's session. So the browser never needs a token it could leak.

1. Access tokens live **15 minutes** (`jwt_expiry = 900`). Refresh tokens **rotate** on every use with a 10 s reuse window to absorb parallel requests. Reuse after that window revokes the session family.
2. JWTs are signed with an **asymmetric ES256 key** (`signing_keys_path`). The server verifies them with `getClaims()` against the JWKS, so verification needs no shared secret.
3. Auth cookies are always `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/` (`src/lib/security/cookies.ts`). No JavaScript can read them, and there is no browser Supabase client.
4. **Never authorize with `getSession()`** on the server: it decodes the cookie without verifying it. Use `getClaims()` (verifies the signature) or `getUser()` (asks the Auth server).
5. The custom access token hook adds `user_role`, `verification` and `mfa_enrolled` claims. These are for **routing and UX only**. RLS and RPCs read the role and verification from the database (`private.my_role()`, `private.is_verified()`), so a 15-minute-old claim can never grant more than the database says now.
6. Admin powers require `aal2` (TOTP verified in this session). Enforced in three places: proxy redirect, `private.is_admin()` in policies, and admin RPCs. Any user with a verified factor is sent to the code challenge after the password on every app route (`mfa_enrolled` + `aal1`, S1-05). Removing a factor always verifies a current code in the same request, and admins can't remove their last one.
7. Responses that set auth cookies carry `Cache-Control: private, no-store` (passed through from `@supabase/ssr`) so a CDN can't serve one user's session to another.
8. Sign-out is `POST` only. "Sign out everywhere" uses `scope: 'global'` (S1-05).
9. Login errors are identical for "no such user" and "wrong password". Signup returns the same message whether or not the email exists.
10. Passwords: 12+ chars with lower, upper, digit and symbol, enforced by Supabase Auth and mirrored in the zod schema. Auth endpoints are rate limited by Supabase (`[auth.rate_limit]`).
11. `?next=` redirects go through `safeNextPath()` (same-origin paths only).

## 3. Database rules (RLS and RPCs)

Every migration follows these. The pgTAP suite in `supabase/tests/database` proves them.

1. **Default deny.** Every table: `enable row level security`, then `revoke all ... from anon, authenticated`, then grant exactly what is needed. New functions in `public` are not executable by clients unless granted (`alter default privileges` in migration 0100).
2. **Column grants, not just row policies.** If a client may update a table, grant `update (col1, col2)` only on the columns they may touch. Status, role, verification, ratings, money and derived fields are never in the list.
3. **State changes are RPCs.** Orders, loads, bids and anything with a lifecycle have no client `insert/update/delete`. A `SECURITY DEFINER` function validates the actor, locks the row (`for update`), checks the current state and applies the transition. The state machines are in [specs/STATE_MACHINES.md](specs/STATE_MACHINES.md).
4. **Every `SECURITY DEFINER` function** sets `search_path = ''`, uses fully qualified names, starts by resolving `auth.uid()`, and raises with a stable code (`'ORDER_NOT_PENDING'`) and SQLSTATE. Error messages never include other users' data.
5. **Helpers live in schema `private`**, which is not exposed through the API. Only the helpers that policies need are granted to `authenticated`.
6. **The server computes money.** Prices are snapshotted from the listing, subtotals computed in SQL, amounts are `bigint` COP. Clients never send a total.
7. **Location privacy.** Farms and delivery locations are readable only by their owner and an MFA admin. Listings and loads expose the municipality code. The booked carrier gets the exact stops through `get_load_stops()` only while the trip is active.
8. **Phones are need-to-know.** `profile_private` is owner/admin only. Parties of a live order get each other's phone through `get_order_contacts()`.
9. **Secrets live outside `public`.** Pickup and delivery codes are in `private.load_secrets` with no grants at all. Code checks commit the failed-attempt counter and lock after 5 misses.
10. **Policies call functions through `(select ...)`** so Postgres evaluates them once per statement, not per row.
11. **Triggers that guard client writes are `SECURITY INVOKER`** and check `current_user = 'authenticated'`. Inside a definer RPC, `current_user` is the owner, so the RPC's own writes pass.
12. **No service-role key in the web app.** Privileged work happens inside RPCs. If a future job needs the service role, it runs in its own process with its own secret, never in Next.js.
13. **Audit log is append-only.** Written by triggers, readable only by MFA admins, `update`/`delete` blocked by a trigger even for the owner, PII columns stripped.

### Checklist for a migration PR

- [ ] RLS enabled, client privileges revoked, then granted explicitly
- [ ] Column-level `update` grants reviewed
- [ ] Lifecycle changes only through RPCs; each RPC checks actor, state and locks
- [ ] `search_path = ''` on every function
- [ ] pgTAP tests for: allowed actor succeeds, every other role fails, wrong state fails
- [ ] `npm run db:lint` clean

## 4. Content Security Policy and headers

The CSP is built per request in `src/proxy.ts` with a fresh nonce (`src/lib/security/csp.ts`). Because of the nonce, every page renders dynamically and Cache Components / PPR stay off.

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Deny by default |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` in dev only) | Only scripts Next stamped with this request's nonce run. No inline handlers, no third-party scripts unless added deliberately with the nonce. |
| `style-src` | `'self' 'nonce-…'` | Tailwind ships as a file; inline `<style>` needs the nonce |
| `style-src-attr` | `'unsafe-inline'` | SSR emits `style=""` attributes (next/image, dev overlay). Attributes can't run script. Revisit when Next drops them. |
| `img-src` | `'self' blob: data: <supabase origin>` | Signed Storage URLs for listing photos |
| `connect-src` | `'self'` | The browser only talks to our server. S5-03 adds the Supabase Realtime `wss:` origin. |
| `object-src`, `frame-src` | `'none'` | No plugins, no embeds |
| `base-uri` | `'none'` | Blocks `<base>` hijacking |
| `form-action` | `'self'` | Forms can't post elsewhere |
| `frame-ancestors` | `'none'` | No clickjacking |
| `report-uri` | `/api/csp-report` | Violations are logged |
| `upgrade-insecure-requests` | prod only | |

Static headers from `next.config.ts`: HSTS (2 years, preload), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy` (camera and geolocation for our own origin only, everything else off), and no `X-Powered-By`.

Next step (S8-04): try `require-trusted-types-for 'script'` once we confirm React and Next run clean under it.

## 5. CSRF

- Server Actions: Next compares `Origin` with `Host` and rejects cross-site posts.
- Route handlers that change state accept `POST` only and rely on `SameSite=Lax` cookies.
- There are no state-changing `GET` endpoints except `/auth/confirm`, which only consumes a one-time token from the email.

## 6. Storage

| Bucket | Path | Write | Read |
|---|---|---|---|
| `listing-photos` | `{farmer_id}/{uuid}.webp` | the farmer, own folder | signed-in users |
| `kyc` | `{user_id}/…` | the owner | the owner and MFA admins |
| `pod` (proof of delivery) | `{load_id}/…` | the booked carrier while picked up / delivered | load parties and admins |

All buckets are private, size-limited and MIME-allowlisted. The server decides a file's type from its first bytes, never from its name or the browser's MIME type (`sniffUpload`). KYC images are stripped of EXIF (GPS!), XMP, IPTC and comments before upload without re-encoding (`stripImageMetadata`, S1-02); listing photos are also re-encoded to WebP (S2-02). KYC uploads follow a fixed naming scheme and freeze, like the PII, once a verification is submitted.

## 7. Secrets

- `.env*` is gitignored except `.env.example`. The web app needs only the Supabase URL and the **publishable** key.
- `supabase/signing_keys.json` is generated locally (`npm run db:keys`) and gitignored. Production signing keys are created in the Supabase dashboard and rotated yearly or on suspicion.
- Production secrets live in the hosting provider's env store. Nobody pastes them in chat, issues or PRs.

## 8. Logging and privacy

- Never log tokens, cookies, document numbers, phone numbers or exact coordinates.
- The audit log strips PII columns before writing.
- Ley 1581: consent is captured at signup (checkbox, versioned in S0-07). Users can export and delete their data (S7). The SIC database registry (RNBD) applies once we pass the thresholds; legal confirms.

## 9. Supply chain

- `npm ci` with the lockfile in CI.
- Dependabot for npm and GitHub Actions, weekly.
- GitHub Actions pinned to a commit SHA (S0-01) with minimal `permissions:`.
- Secret scanning and push protection on the repo.

## 10. Reporting a vulnerability

Email the maintainers (address to be set in S0-07) rather than opening a public issue. We answer within 72 hours.
