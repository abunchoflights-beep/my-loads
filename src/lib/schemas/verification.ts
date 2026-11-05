/**
 * Input contract for the identity verification form (S1-02).
 * Mirrors the CHECK constraints on public.profile_private, so the database
 * rarely has to reject what the form accepted.
 */
import { z } from "zod";

export const DOCUMENT_TYPES = ["CC", "CE", "NIT", "PPT", "PASSPORT"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Kinds of supporting file, matching the kyc bucket naming scheme. */
export const KYC_FILE_KINDS = ["document", "license", "rut"] as const;
export type KycFileKind = (typeof KYC_FILE_KINDS)[number];

/** Largest supporting file accepted (the kyc bucket allows 10 MB). */
export const KYC_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Normalizes a phone number to E.164. A Colombian mobile typed the local way
 * ("300 123 4567") gets +57; anything else must already be E.164.
 *
 * @returns The E.164 number, or null when it can't be read as one.
 */
export function normalizePhone(raw: string): string | null {
  const compact = raw.replace(/[\s().-]/g, "");
  if (/^3[0-9]{9}$/.test(compact)) return `+57${compact}`;
  if (/^57(3[0-9]{9})$/.test(compact)) return `+${compact}`;
  if (/^\+[1-9][0-9]{7,14}$/.test(compact)) return compact;
  return null;
}

/** Removes the dots and spaces people type in cédulas ("1.020.304.050"). */
export function normalizeDocumentNumber(raw: string): string {
  return raw.replace(/[\s.]/g, "").toUpperCase();
}

export const verificationFormSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre como aparece en el documento.")
    .max(160, "Máximo 160 caracteres."),
  documentType: z.enum(DOCUMENT_TYPES, { error: "Elige el tipo de documento." }),
  documentNumber: z
    .string()
    .transform(normalizeDocumentNumber)
    .pipe(z.string().regex(/^[0-9A-Z-]{4,20}$/, "Revisa el número: solo números, letras y guiones.")),
  phone: z.string().transform((value, ctx) => {
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Escribe tu celular, por ejemplo 300 123 4567." });
      return z.NEVER;
    }
    return phone;
  }),
});

export type VerificationFormInput = z.infer<typeof verificationFormSchema>;

/** Field names the database reports in VERIFICATION_INCOMPLETE's DETAIL → form field names. */
export const MISSING_FIELD_TO_FORM: Readonly<Record<string, string>> = {
  legal_name: "legalName",
  document_type: "documentType",
  document_number: "documentNumber",
  phone: "phone",
  document_file: "documentFile",
  license_file: "licenseFile",
};
