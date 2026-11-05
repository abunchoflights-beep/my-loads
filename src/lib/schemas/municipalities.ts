/**
 * Input contracts for municipality search and selection (S1-06).
 * Shared by the route handler, Server Actions and their unit tests.
 */
import { z } from "zod";

/** A DANE DIVIPOLA municipality code: 5 digits, leading zero kept ("05045"). */
export const municipalityCodeSchema = z.string().regex(/^[0-9]{5}$/, "Elige un municipio de la lista.");

/** `GET /api/municipalities?q=` — what the user typed in the picker. */
export const municipalitySearchSchema = z.object({
  q: z.string().trim().min(2).max(40),
});

/** "Tu municipio" form on /account. */
export const updateMunicipalitySchema = z.object({
  municipalityCode: municipalityCodeSchema,
});

export type MunicipalitySearchInput = z.infer<typeof municipalitySearchSchema>;
export type UpdateMunicipalityInput = z.infer<typeof updateMunicipalitySchema>;
