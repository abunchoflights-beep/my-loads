import "server-only";

/**
 * The signed-in user's public profile fields (profiles table). Only the
 * columns with client update grants are written here (display_name,
 * business_name, municipality_code); role, verification and ratings change
 * through RPCs only.
 */
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { PG, readFailed } from "@/lib/data/errors";
import type { MunicipalityOption } from "@/lib/data/municipalities";
import { formatMunicipality } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/** What /account shows and edits. */
export type MyProfile = {
  readonly displayName: string;
  readonly municipality: MunicipalityOption | null;
};

/**
 * Reads the caller's profile. RLS lets any signed-in user read public
 * profile fields; the id filter scopes it to the caller.
 *
 * @param userId - The signed-in user's id (from getViewer()).
 */
export async function getMyProfile(userId: string): Promise<MyProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, municipality_code, municipality:municipalities(name, department_name)")
    .eq("id", userId)
    .single();
  if (error) readFailed("PROFILE_READ_FAILED", error);
  return {
    displayName: data.display_name,
    municipality:
      data.municipality_code && data.municipality
        ? { code: data.municipality_code, label: formatMunicipality(data.municipality) }
        : null,
  };
}

/**
 * Sets the caller's municipality. The FK to municipalities rejects unknown codes.
 *
 * @param userId - The signed-in user's id.
 * @param code - 5-digit DANE code, already validated by its schema.
 */
export async function updateMyMunicipality(userId: string, code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ municipality_code: code }).eq("id", userId);
  if (!error) return ok(undefined);
  if (error.code === PG.foreignKeyViolation)
    return fail("Elige un municipio de la lista.", "municipalityCode");
  console.error("PROFILE_MUNICIPALITY_UPDATE_FAILED", error.code);
  return fail("No pudimos guardar tu municipio. Intenta de nuevo.");
}
