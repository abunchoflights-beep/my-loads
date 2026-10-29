---
id: S0-07
title: "Legal: data policy (Ley 1581), terms, consent capture"
sprint: 0
milestone: "Sprint 0 · Foundations"
labels: [spec, sprint-0, legal, privacy]
status: todo
---

# S0-07 · Legal: data policy (Ley 1581), terms, consent capture

**Status:** Not started

## Requirement

As a user in Colombia, I know what data is collected, why, and how to exercise my habeas data rights. As the company, we can prove each user consented to a specific policy version.

## Behavior

- Given signup, when the user submits, then the consent checkbox is required and the accepted policy version is stored with a timestamp.
- Given a new policy version, when an existing user signs in, then they are asked to accept it before continuing.
- Given a user request, when they ask for access, correction or deletion, then there is a documented channel and a 15 business day response target.

## Invariants

- Consent records are append-only.
- The policy names the data controller, purposes, rights, and contact channel as Decreto 1377 requires.

## Acceptance criteria

- [ ] Policy and terms text approved by a lawyer and published at `/legal/privacy` and `/legal/terms`
- [ ] `consents` table (user, document, version, accepted_at, ip hash) with RLS
- [ ] Security contact email published in docs/SECURITY.md
- [ ] Decision on RNBD registration documented

## Notes

Needs the client's legal entity details.
