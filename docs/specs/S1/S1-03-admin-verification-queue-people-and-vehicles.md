---
id: S1-03
title: "Admin verification queue (people and vehicles)"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, admin, trust]
status: todo
---

# S1-03 · Admin verification queue (people and vehicles)

**Status:** Not started

## Requirement

As an operations admin, I review pending people and vehicles in one queue and approve or reject with a note, with MFA required.

## Behavior

- Given an admin at `aal1`, when they open `/admin`, then they are sent to `/account/security` to step up.
- Given an admin at `aal2`, then they see pending users and vehicles, oldest first, with document previews via short-lived signed URLs.
- Given reject, then a note is mandatory and the user sees it.
- Given an admin reviewing their own account, then `SELF_REVIEW_FORBIDDEN`.

## Invariants

- Every decision is in the audit log with the admin's id.
- Signed URLs for KYC files expire in 60 seconds.

## Acceptance criteria

- [x] `admin_review_verification()`, `admin_review_vehicle()`, `admin_set_suspended()`
- [ ] Queue UI with approve/reject and notes
- [ ] Notification to the user on decision (S3-06 outbox)
