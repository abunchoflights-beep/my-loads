import "server-only";

/**
 * Identity verification (S1-02): PII in profile_private, supporting files in
 * the private kyc bucket, and submit_verification() moving the user to
 * pending. RLS and the kyc policies freeze PII and files once submitted.
 * Nothing here logs values: only stable codes and Postgres error codes.
 */
import { randomUUID } from "node:crypto";
import { fail, failFields, ok, type ActionResult } from "@/lib/action-result";
import type { VerificationStatus } from "@/lib/auth/viewer";
import { PG, readFailed } from "@/lib/data/errors";
import {
  MISSING_FIELD_TO_FORM,
  type DocumentType,
  type KycFileKind,
  type VerificationFormInput,
} from "@/lib/schemas/verification";
import type { SniffedUpload } from "@/lib/security/file-metadata";
import { createClient } from "@/lib/supabase/server";

/** What the verification screen shows for the signed-in user. */
export type MyVerification = {
  readonly status: VerificationStatus;
  readonly legalName: string | null;
  readonly documentType: DocumentType | null;
  readonly documentNumber: string | null;
  readonly phone: string | null;
  readonly reviewNote: string | null;
  readonly submittedAt: string | null;
  /** Which kinds of supporting file are already in kyc/{uid}/. */
  readonly files: Readonly<Record<KycFileKind, boolean>>;
};

const MISSING_MESSAGES: Readonly<Record<string, string>> = {
  legalName: "Escribe tu nombre como aparece en el documento.",
  documentType: "Elige el tipo de documento.",
  documentNumber: "Escribe el número del documento.",
  phone: "Escribe tu celular.",
  documentFile: "Sube una foto o PDF de tu documento.",
  licenseFile: "Sube una foto o PDF de tu licencia de conducción.",
};

/** Statuses in which the user may still edit PII and files (matches private.can_edit_verification). */
export function canEditVerification(status: VerificationStatus): boolean {
  return status === "unverified" || status === "rejected";
}

/**
 * Reads the caller's verification state. The status comes from the database,
 * not the JWT claim, so it is current right after a submit.
 *
 * @param userId - The signed-in user's id.
 */
export async function getMyVerification(userId: string): Promise<MyVerification> {
  const supabase = await createClient();
  const [profile, pii, listed] = await Promise.all([
    supabase.from("profiles").select("verification_status").eq("id", userId).single(),
    supabase
      .from("profile_private")
      .select("legal_name, document_type, document_number, phone, review_note, submitted_at")
      .eq("user_id", userId)
      .single(),
    supabase.storage.from("kyc").list(userId, { limit: 100 }),
  ]);
  if (profile.error) readFailed("VERIFICATION_STATUS_READ_FAILED", profile.error);
  if (pii.error) readFailed("VERIFICATION_PII_READ_FAILED", pii.error);
  const names = (listed.data ?? []).map((f) => f.name);
  const has = (kind: KycFileKind): boolean => names.some((n) => n.startsWith(`${kind}-`));
  return {
    status: profile.data.verification_status,
    legalName: pii.data.legal_name,
    documentType: pii.data.document_type,
    documentNumber: pii.data.document_number,
    phone: pii.data.phone,
    reviewNote: pii.data.review_note,
    submittedAt: pii.data.submitted_at,
    files: { document: has("document"), license: has("license"), rut: has("rut") },
  };
}

/**
 * Saves the PII fields. RLS only lets the owner write while unverified or
 * rejected; zero updated rows means the data is frozen.
 *
 * @param userId - The signed-in user's id.
 * @param input - Parsed and normalized form values.
 */
export async function saveVerificationDetails(
  userId: string,
  input: VerificationFormInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_private")
    .update({
      legal_name: input.legalName,
      document_type: input.documentType,
      document_number: input.documentNumber,
      phone: input.phone,
    })
    .eq("user_id", userId)
    .select("user_id");
  if (error?.code === PG.uniqueViolation) {
    // Don't confirm that the document belongs to another account (SECURITY §3.4).
    return fail("No pudimos usar este documento. Escríbenos a soporte.", "documentNumber");
  }
  if (error) {
    console.error("VERIFICATION_SAVE_FAILED", error.code);
    return fail("No pudimos guardar tus datos. Intenta de nuevo.");
  }
  if (data.length === 0) return fail("Tu información ya está en revisión y no se puede cambiar.");
  return ok(undefined);
}

/**
 * Uploads one cleaned supporting file, then removes older files of the same
 * kind so the reviewer sees only the latest.
 *
 * @param userId - The signed-in user's id (the kyc folder).
 * @param kind - document, license or rut.
 * @param bytes - File contents, metadata already stripped.
 * @param sniffed - Type detected from the bytes.
 */
export async function replaceKycFile(
  userId: string,
  kind: KycFileKind,
  bytes: Uint8Array,
  sniffed: SniffedUpload,
): Promise<ActionResult> {
  const supabase = await createClient();
  const bucket = supabase.storage.from("kyc");
  const name = `${kind}-${randomUUID()}.${sniffed.kind}`;
  const { error } = await bucket.upload(`${userId}/${name}`, bytes, {
    contentType: sniffed.mime,
    upsert: false,
  });
  if (error) {
    console.error("KYC_UPLOAD_FAILED", kind);
    return fail("No pudimos subir el archivo. Revisa tu conexión e intenta de nuevo.", `${kind}File`);
  }
  const { data: existing } = await bucket.list(userId, { limit: 100 });
  const old = (existing ?? []).filter((f) => f.name.startsWith(`${kind}-`) && f.name !== name);
  if (old.length > 0) await bucket.remove(old.map((f) => `${userId}/${f.name}`));
  return ok(undefined);
}

/**
 * Calls submit_verification(). Missing fields come back in the error DETAIL
 * and are mapped to form fields. On success the session is refreshed so the
 * JWT's verification claim (banner, routing) says "pending" right away.
 *
 * @returns The new status, or one message per missing field.
 */
export async function submitVerification(): Promise<ActionResult<{ status: VerificationStatus }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_verification");
  if (error?.message === "VERIFICATION_INCOMPLETE") {
    const fields: Record<string, string> = {};
    for (const missing of (error.details ?? "").split(",")) {
      const field = MISSING_FIELD_TO_FORM[missing];
      if (field) fields[field] = MISSING_MESSAGES[field] ?? "Falta este dato.";
    }
    return failFields("Faltan datos para enviar tu verificación.", fields);
  }
  if (error?.message === "VERIFICATION_NOT_ALLOWED") return fail("Tu verificación ya está en revisión.");
  if (error) {
    console.error("VERIFICATION_SUBMIT_FAILED", error.code);
    return fail("No pudimos enviar tu verificación. Intenta de nuevo.");
  }
  await supabase.auth.refreshSession();
  return ok({ status: data });
}
