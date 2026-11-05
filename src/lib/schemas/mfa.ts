/**
 * Input contracts for two-step verification with an authenticator app (S1-05).
 */
import { z } from "zod";

/** A 6-digit TOTP code. Spaces are ignored ("123 456"). */
export const totpCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^[0-9]{6}$/, "Escribe los 6 números de tu app."));

export const factorIdSchema = z.uuid();

/** The code challenge after the password, or on an admin page at aal1. */
export const verifyTotpSchema = z.object({
  code: totpCodeSchema,
  next: z.string().optional(),
});

/** Confirms a new factor with its first code. */
export const confirmEnrollmentSchema = z.object({
  factorId: factorIdSchema,
  code: totpCodeSchema,
  next: z.string().optional(),
});

/** Starts enrolling a new factor. The name tells two devices apart. */
export const startEnrollmentSchema = z.object({
  friendlyName: z.string().trim().min(2, "Ponle un nombre, por ejemplo «Mi celular».").max(40),
});

/** Removes a factor. A current code is always required (fresh aal2). */
export const removeFactorSchema = z.object({
  factorId: factorIdSchema,
  code: totpCodeSchema,
});
