# Sprint plan

Two-week sprints, spec-driven. Each issue in `docs/specs/S*/` has four parts:

- **Requirement**: who needs what, and why.
- **Behavior**: Given / when / then. This is what we demo.
- **Invariants**: what must stay true no matter what. These become pgTAP tests and unit tests.
- **Acceptance criteria**: the checklist that closes the issue.

`npm run gh:issues` turns them into GitHub issues with milestones and labels (see README).

Dates assume we start Monday, Nov 2, 2026 and stop for the holidays from Dec 24 to Jan 11. Move them if the team starts later.

## Definition of ready

- The spec has all four parts and no open question blocking it (see REQUIREMENTS, open questions).
- Dependencies are done or in the same sprint.
- Before coding starts, the spec has a **Technical plan** and a **Tasks** list (template: `specs/_TEMPLATE.md`, workflow: `AGENTS.md`).

## Definition of done

- Every acceptance box is ticked.
- Every invariant has a test (pgTAP for the database, vitest for code).
- CI green: `vp check` (format, lint with constitution rules, types), unit tests, migration guard, build, db lint, pgTAP.
- The security checklist in the PR template is answered.
- Screens checked on a 390 px wide phone viewport, and copy reviewed in Spanish.
- `SpecPlaceholder` removed from the screens the issue covers.

## Overview

| Sprint | Dates | Goal | Issues |
|---|---|---|---|
| 0 · Foundations | Nov 2 to Nov 13, 2026 | The skeleton is secure and testable. | 8 |
| 1 · Identity | Nov 16 to Nov 27, 2026 | Real people and real trucks, verified. | 7 |
| 2 · Listings | Nov 30 to Dec 11, 2026 | Farmers publish, buyers see. | 5 |
| 3 · Orders | Dec 14 to Dec 23, 2026 (short sprint) | A buyer can buy a carguita. | 6 |
| 4 · Load board | Jan 12 to Jan 23, 2027 | The freight gets a truck. | 6 |
| 5 · Trips | Jan 26 to Feb 6, 2027 | The load arrives, with proof. | 5 |
| 6 · Payments | Feb 9 to Feb 20, 2027 | Money is held and released. | 5 |
| 7 · Trust | Feb 23 to Mar 6, 2027 | Ratings, disputes and operations. | 4 |
| 8 · Launch | Mar 9 to Mar 20, 2027 | Closed beta on the Urabá to Medellín and Bogotá lanes. | 6 |

## Sprint 0 · Foundations

**Goal:** The skeleton is secure and testable.  
**Dates:** Nov 2 to Nov 13, 2026

| ID | Issue | Labels | Status |
|---|---|---|---|
| S0-01 | [Repository, CI and branch protection](specs/S0/S0-01-repository-ci-and-branch-protection.md) | infra, security | partial |
| S0-02 | [Local Supabase on Docker and migration workflow](specs/S0/S0-02-local-supabase-on-docker-and-migration-workflow.md) | database, infra | done |
| S0-03 | [Auth baseline: SSR sessions, HttpOnly cookies, verified JWTs](specs/S0/S0-03-auth-baseline-ssr-sessions-httponly-cookies-verifi.md) | auth, security | done |
| S0-04 | [Security headers and nonce-based CSP](specs/S0/S0-04-security-headers-and-nonce-based-csp.md) | security | done |
| S0-05 | [Design system and role-based app shell](specs/S0/S0-05-design-system-and-role-based-app-shell.md) | ui, design | done |
| S0-06 | [RLS and RPC test harness (pgTAP) in CI](specs/S0/S0-06-rls-and-rpc-test-harness-pgtap-in-ci.md) | database, security, testing | done |
| S0-07 | [Legal: data policy (Ley 1581), terms, consent capture](specs/S0/S0-07-legal-data-policy-ley-1581-terms-consent-capture.md) | legal, privacy | todo |
| S0-08 | [Typed Supabase client from generated database types](specs/S0/S0-08-typed-supabase-client-from-generated-database-type.md) | dx, database | todo |

## Sprint 1 · Identity

**Goal:** Real people and real trucks, verified.  
**Dates:** Nov 16 to Nov 27, 2026

| ID | Issue | Labels | Status |
|---|---|---|---|
| S1-01 | [Sign up with a role, confirm email, sign in and out](specs/S1/S1-01-sign-up-with-a-role-confirm-email-sign-in-and-out.md) | auth, onboarding | partial |
| S1-02 | [Identity verification (KYC-lite) submission](specs/S1/S1-02-identity-verification-kyc-lite-submission.md) | trust, onboarding | todo |
| S1-03 | [Admin verification queue (people and vehicles)](specs/S1/S1-03-admin-verification-queue-people-and-vehicles.md) | admin, trust | todo |
| S1-04 | [Farms, delivery locations and vehicles](specs/S1/S1-04-farms-delivery-locations-and-vehicles.md) | onboarding | partial |
| S1-05 | [MFA (TOTP), step-up and sign out everywhere](specs/S1/S1-05-mfa-totp-step-up-and-sign-out-everywhere.md) | auth, security | todo |
| S1-06 | [DANE municipalities table and picker](specs/S1/S1-06-dane-municipalities-table-and-picker.md) | data, ui | todo |
| S1-07 | [Password reset](specs/S1/S1-07-password-reset.md) | auth | todo |

## Sprint 2 · Listings

**Goal:** Farmers publish, buyers see.  
**Dates:** Nov 30 to Dec 11, 2026

| ID | Issue | Labels | Status |
|---|---|---|---|
| S2-01 | [Product catalog management](specs/S2/S2-01-product-catalog-management.md) | admin, data | partial |
| S2-02 | [Publish and edit a carguita (listing)](specs/S2/S2-02-publish-and-edit-a-carguita-listing.md) | farmer, marketplace | partial |
| S2-03 | [Market: browse, filter and search](specs/S2/S2-03-market-browse-filter-and-search.md) | buyer, marketplace | partial |
| S2-04 | [Listing detail](specs/S2/S2-04-listing-detail.md) | buyer, marketplace | todo |
| S2-05 | [Product alerts for buyers](specs/S2/S2-05-product-alerts-for-buyers.md) | buyer, notifications | todo |

## Sprint 3 · Orders

**Goal:** A buyer can buy a carguita.  
**Dates:** Dec 14 to Dec 23, 2026 (short sprint)

| ID | Issue | Labels | Status |
|---|---|---|---|
| S3-01 | [Place an order](specs/S3/S3-01-place-an-order.md) | buyer, orders | partial |
| S3-02 | [Farmer order inbox: accept or reject](specs/S3/S3-02-farmer-order-inbox-accept-or-reject.md) | farmer, orders | partial |
| S3-03 | [Buyer orders and cancellation](specs/S3/S3-03-buyer-orders-and-cancellation.md) | buyer, orders | partial |
| S3-04 | [Reveal contacts for live orders](specs/S3/S3-04-reveal-contacts-for-live-orders.md) | orders, privacy | partial |
| S3-05 | [Housekeeping jobs with pg_cron](specs/S3/S3-05-housekeeping-jobs-with-pg-cron.md) | database, ops | partial |
| S3-06 | [Notifications v1 (in-app + email) via outbox](specs/S3/S3-06-notifications-v1-in-app-email-via-outbox.md) | notifications, infra | todo |

## Sprint 4 · Load board

**Goal:** The freight gets a truck.  
**Dates:** Jan 12 to Jan 23, 2027

| ID | Issue | Labels | Status |
|---|---|---|---|
| S4-01 | [Load board with lane filters](specs/S4/S4-01-load-board-with-lane-filters.md) | carrier, freight | partial |
| S4-02 | [Load detail and bidding](specs/S4/S4-02-load-detail-and-bidding.md) | carrier, freight | partial |
| S4-03 | [Shipper reviews bids and books a carrier](specs/S4/S4-03-shipper-reviews-bids-and-books-a-carrier.md) | buyer, freight | partial |
| S4-04 | [Carrier unbooks: load goes back to the board](specs/S4/S4-04-carrier-unbooks-load-goes-back-to-the-board.md) | carrier, freight | partial |
| S4-05 | [Lane alerts for carriers](specs/S4/S4-05-lane-alerts-for-carriers.md) | carrier, notifications | todo |
| S4-06 | [Suggested freight rate](specs/S4/S4-06-suggested-freight-rate.md) | freight, pricing | todo |

## Sprint 5 · Trips

**Goal:** The load arrives, with proof.  
**Dates:** Jan 26 to Feb 6, 2027

| ID | Issue | Labels | Status |
|---|---|---|---|
| S5-01 | [Active trip screen](specs/S5/S5-01-active-trip-screen.md) | carrier, trips | todo |
| S5-02 | [Pickup and delivery with one-time codes](specs/S5/S5-02-pickup-and-delivery-with-one-time-codes.md) | trips, security | partial |
| S5-03 | [Live location and tracking](specs/S5/S5-03-live-location-and-tracking.md) | trips, realtime | partial |
| S5-04 | [Proof of delivery photos](specs/S5/S5-04-proof-of-delivery-photos.md) | trips | partial |
| S5-05 | [PWA and offline tolerance](specs/S5/S5-05-pwa-and-offline-tolerance.md) | pwa, performance | todo |

## Sprint 6 · Payments

**Goal:** Money is held and released.  
**Dates:** Feb 9 to Feb 20, 2027

| ID | Issue | Labels | Status |
|---|---|---|---|
| S6-01 | [ADR: payment provider](specs/S6/S6-01-adr-payment-provider.md) | payments, adr | todo |
| S6-02 | [Buyer pays at acceptance (funds held)](specs/S6/S6-02-buyer-pays-at-acceptance-funds-held.md) | payments | todo |
| S6-03 | [Release funds on delivery](specs/S6/S6-03-release-funds-on-delivery.md) | payments | todo |
| S6-04 | [Payout accounts for farmers and carriers](specs/S6/S6-04-payout-accounts-for-farmers-and-carriers.md) | payments, onboarding | todo |
| S6-05 | [Platform fee and receipts](specs/S6/S6-05-platform-fee-and-receipts.md) | payments, legal | todo |

## Sprint 7 · Trust

**Goal:** Ratings, disputes and operations.  
**Dates:** Feb 23 to Mar 6, 2027

| ID | Issue | Labels | Status |
|---|---|---|---|
| S7-01 | [Ratings](specs/S7/S7-01-ratings.md) | trust | todo |
| S7-02 | [Disputes](specs/S7/S7-02-disputes.md) | trust, admin | todo |
| S7-03 | [Admin console: KPIs and audit viewer](specs/S7/S7-03-admin-console-kpis-and-audit-viewer.md) | admin | todo |
| S7-04 | [Abuse controls and rate limits](specs/S7/S7-04-abuse-controls-and-rate-limits.md) | security | todo |

## Sprint 8 · Launch

**Goal:** Closed beta on the Urabá to Medellín and Bogotá lanes.  
**Dates:** Mar 9 to Mar 20, 2027

| ID | Issue | Labels | Status |
|---|---|---|---|
| S8-01 | [Accessibility audit (WCAG 2.2 AA)](specs/S8/S8-01-accessibility-audit-wcag-2-2-aa.md) | a11y | todo |
| S8-02 | [Performance budget on low-end Android](specs/S8/S8-02-performance-budget-on-low-end-android.md) | performance | todo |
| S8-03 | [Observability](specs/S8/S8-03-observability.md) | ops | todo |
| S8-04 | [Security review and penetration test](specs/S8/S8-04-security-review-and-penetration-test.md) | security | todo |
| S8-05 | [Production environment](specs/S8/S8-05-production-environment.md) | infra, ops | todo |
| S8-06 | [English locale](specs/S8/S8-06-english-locale.md) | i18n | todo |
