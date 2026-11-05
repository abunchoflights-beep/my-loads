"use server";

/**
 * Server Action for /account/verification (S1-02): validate, clean and upload
 * the supporting files, save the PII, then submit for review.
 */
import { revalidatePath } from "next/cache";
import { fail, failFields, type ActionResult } from "@/lib/action-result";
import type { AppRole } from "@/lib/auth/access";
import { requireRole, type VerificationStatus } from "@/lib/auth/viewer";
import {
  canEditVerification,
  getMyVerification,
  replaceKycFile,
  saveVerificationDetails,
  submitVerification,
} from "@/lib/data/verification";
import { KYC_MAX_BYTES, verificationFormSchema, type KycFileKind } from "@/lib/schemas/verification";
import {
  MalformedImageError,
  sniffUpload,
  stripImageMetadata,
  type SniffedUpload,
} from "@/lib/security/file-metadata";

type CleanFile = { readonly kind: KycFileKind; readonly bytes: Uint8Array; readonly sniffed: SniffedUpload };

/** Which supporting files each role may send (the RPC decides which are required). */
const FILE_KINDS_BY_ROLE: Readonly<Record<AppRole, readonly KycFileKind[]>> = {
  farmer: ["document", "rut"],
  buyer: ["document"],
  carrier: ["document", "license"],
  admin: ["document"],
};

/** A text field's value; a file or a missing field reads as "". */
function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Reads, type-checks and cleans one uploaded file; returns a field error otherwise. */
async function cleanFile(
  kind: KycFileKind,
  value: FormDataEntryValue | null,
): Promise<CleanFile | string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > KYC_MAX_BYTES) return "El archivo pesa más de 10 MB. Toma la foto con menos resolución.";
  const raw = new Uint8Array(await value.arrayBuffer());
  const sniffed = sniffUpload(raw);
  if (!sniffed) return "Sube un PDF, JPG o PNG.";
  try {
    return { kind, bytes: stripImageMetadata(raw, sniffed.kind), sniffed };
  } catch (e) {
    if (e instanceof MalformedImageError) return "No pudimos leer la imagen. Toma la foto de nuevo.";
    throw e;
  }
}

/** Saves and submits the verification form. */
export async function submitVerificationForm(
  _prev: ActionResult<{ status: VerificationStatus }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ status: VerificationStatus }>> {
  const viewer = await requireRole();
  const values = {
    legalName: text(formData, "legalName"),
    documentType: text(formData, "documentType"),
    documentNumber: text(formData, "documentNumber"),
    phone: text(formData, "phone"),
  };

  const fieldErrors: Record<string, string> = {};
  const parsed = verificationFormSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  }

  const files: CleanFile[] = [];
  for (const kind of FILE_KINDS_BY_ROLE[viewer.role]) {
    // Sequential: each file can be 10 MB, and memory matters more than speed here.
    // oxlint-disable-next-line no-await-in-loop -- one file in memory at a time
    const result = await cleanFile(kind, formData.get(`${kind}File`));
    if (typeof result === "string") fieldErrors[`${kind}File`] = result;
    else if (result) files.push(result);
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return failFields("Revisa los datos marcados.", fieldErrors, values);
  }

  const current = await getMyVerification(viewer.id);
  if (!canEditVerification(current.status)) return fail("Tu verificación ya está en revisión.");

  const saved = await saveVerificationDetails(viewer.id, parsed.data);
  if (!saved.ok) return { ...saved, values };

  for (const file of files) {
    // oxlint-disable-next-line no-await-in-loop -- upload one file at a time on slow rural connections
    const uploaded = await replaceKycFile(viewer.id, file.kind, file.bytes, file.sniffed);
    if (!uploaded.ok) return { ...uploaded, values };
  }

  const submitted = await submitVerification();
  revalidatePath("/", "layout");
  return submitted.ok ? submitted : { ...submitted, values };
}
