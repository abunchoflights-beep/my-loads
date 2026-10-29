---
id: S1-02
title: "Identity verification (KYC-lite) submission"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, trust, onboarding]
status: todo
---

# S1-02 · Identity verification (KYC-lite) submission

**Status:** Not started

## Requirement

As a user, I submit my legal name, document, phone and a supporting file so the platform can trust me with real money and real cargo.

## Behavior

- Given an unverified user, when they fill legal name, document type and number, phone in E.164 and upload a file to `kyc/{uid}/`, then `submit_verification()` moves them to `pending`.
- Given missing fields, then the RPC fails with `VERIFICATION_INCOMPLETE` and the form highlights them.
- Given status `pending` or `verified`, then the PII form is read-only.
- Given status `rejected`, then the admin's note is shown and the user can fix and resubmit.

## Invariants

- A document (type + number) belongs to at most one account.
- KYC files are readable only by the owner and MFA admins.
- PII is never written to logs or the audit log.

## Acceptance criteria

- [x] `profile_private`, `submit_verification()`, `kyc` bucket policies
- [ ] `/account/verification` form with upload (PDF/JPG/PNG, 10 MB)
- [ ] Carriers also upload driver's license; farmers optionally RUT
- [ ] pgTAP: duplicate document rejected, frozen PII after submit
