"use server";

/**
 * Server Actions for /account. Profile fields only; verification and security
 * have their own pages and actions.
 */
import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/action-result";
import { requireRole } from "@/lib/auth/viewer";
import { updateMyMunicipality } from "@/lib/data/profiles";
import { updateMunicipalitySchema } from "@/lib/schemas/municipalities";

/** Saves "Tu municipio" (S1-06). The database rejects codes outside DIVIPOLA. */
export async function updateMunicipality(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const viewer = await requireRole();
  const parsed = updateMunicipalitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Elige un municipio de la lista.", "municipalityCode");

  const result = await updateMyMunicipality(viewer.id, parsed.data.municipalityCode);
  if (result.ok) revalidatePath("/account");
  return result;
}
