---
id: S1-02
title: "Identity verification (KYC-lite) submission"
sprint: 1
milestone: "Sprint 1 · Identity"
labels: [spec, sprint-1, trust, onboarding]
status: in-progress
---

# S1-02 · Identity verification (KYC-lite) submission

**Status:** In progress

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

## Technical plan

| Area | Change |
|---|---|
| Data model / migration | `20261105000200_verification_documents.sql`. No new tables. Files live in the existing private `kyc` bucket as `kyc/{uid}/{kind}-{uuid}.{pdf\|jpg\|png}`, where kind is `document` (identity document, everyone), `license` (driver's license, carriers) or `rut` (optional, farmers). |
| RPCs | `submit_verification()` is replaced (`create or replace` in the new migration). It now also requires a `document` file, plus a `license` file for carriers, and raises `VERIFICATION_INCOMPLETE` with `DETAIL` listing the missing fields (`legal_name,document_type,document_number,phone,document_file,license_file`), so the form can highlight each one. Other codes unchanged: `AUTH_REQUIRED`, `VERIFICATION_NOT_ALLOWED`. New helper `private.can_edit_verification()` (definer, `search_path = ''`): the caller's status is `unverified` or `rejected`. |
| RLS and grants | The `kyc` insert policy is replaced: own folder only, file name must match the pattern above, and only while `can_edit_verification()` (files freeze with the PII). New delete policy: the owner can remove their own files under the same condition, to replace a wrong upload. Read policy unchanged (owner or MFA admin). No table grants change. |
| Routes | `/account/verification` (any signed-in role), already in `access.ts` and ROUTES.md. |
| Data layer | `src/lib/data/verification.ts`: `getMyVerification()` (status, PII for the owner, admin note, which document kinds are on file), `saveVerificationDetails()`, `uploadKycFile()`, `removeKycFiles()`, `submitVerification()`. One code map turns RPC and Postgres errors into Spanish messages. |
| Contracts | `verificationFormSchema` (zod): `legalName` 3–160 chars; `documentType` CC\|CE\|NIT\|PPT\|PASSPORT; `documentNumber` with dots and spaces removed, then `^[0-9A-Za-z-]{4,20}$`; `phone`: a 10-digit Colombian mobile (`3xx…`) becomes `+57…`, otherwise strict E.164. Files: at most 10 MB each, type taken from the file's first bytes (PDF/JPEG/PNG), never from its name or the browser's type. The `submitVerification` Server Action returns `ActionResult<{ status }>`; field errors use a new optional `fields` map (additive to the `ActionResult` contract). |
| Files | `src/lib/security/file-metadata.ts`: `sniffKycFile()` checks magic bytes; `stripImageMetadata()` removes EXIF/XMP/IPTC/comment segments from JPEG and `eXIf`/text chunks from PNG with no re-encoding and no new dependency. SECURITY §6 requires GPS to be stripped. PDFs are stored as uploaded. |
| Next config | `serverActions.bodySizeLimit` and `proxyClientMaxBodySize` raised to `21mb` (two 10 MB files plus fields). Applies to every action; rate limits arrive in S7-04. |
| UI | `/account/verification`: editable form when `unverified`/`rejected` (the rejected state shows the admin note above the form); a read-only summary when `pending`/`verified`/`suspended`, with the document number and phone partly masked. File inputs accept `.pdf,.jpg,.jpeg,.png`. The carrier sees a required license field; the farmer sees an optional RUT field. New `SelectField` and `FileField` primitives next to `Field`. After a submit, the session is refreshed so the verification banner reflects `pending` right away. |
| Dependencies | None. |
| Security | PII goes only to `profile_private` (owner and MFA admin) and the private `kyc` bucket. Nothing is logged: errors log the code only. The audit trigger already strips `legal_name`, `document_number` and `phone`; pgTAP proves it. A duplicate document shows "No pudimos usar este documento. Escríbenos a soporte." instead of saying the number belongs to another account (SECURITY §3.4). |

## Tasks

- [ ] 1. Migration: `can_edit_verification()`, new `submit_verification()`, kyc insert and delete policies
- [ ] 2. pgTAP `04_verification.test.sql`: file rules per role, duplicate document, frozen PII and files after submit, rejected → resubmit, owner/admin-only reads, no PII in the audit log
- [ ] 3. `npm run db:types`
- [ ] 4. `file-metadata.ts` + unit tests; zod schemas + unit tests; data layer
- [ ] 5. `submitVerification` Server Action, Next body limits
- [ ] 6. UI: form, read-only summary, rejected note; `SelectField`, `FileField`
- [ ] 7. Docs: DESIGN (new fields), SECURITY §6 (KYC metadata), ActionResult `fields` in AGENTS.md, SPRINTS, this spec

## Notes

- Removing JPEG metadata also removes the EXIF orientation tag, so a phone photo can show rotated in the admin queue. Admins can rotate the preview (S1-03); re-encoding would need a new dependency.
