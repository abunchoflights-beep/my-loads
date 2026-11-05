import "server-only";

/**
 * DANE municipalities (S1-06). Names elsewhere come from FK embeds in each
 * query; this module only serves the picker's search.
 */
import { readFailed } from "@/lib/data/errors";
import { formatMunicipality } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

/** A picker suggestion: the DANE code and "Apartadó, Antioquia". */
export type MunicipalityOption = { readonly code: string; readonly label: string };

/**
 * Accent-insensitive search, best matches first, at most 20.
 *
 * @param q - What the user typed (2–40 characters, already validated).
 */
export async function searchMunicipalities(q: string): Promise<readonly MunicipalityOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("search_municipalities", { p_query: q, p_limit: 20 })
    .select("code, name, department_name");
  if (error) readFailed("MUNICIPALITY_SEARCH_FAILED", error);
  return data.map((m) => ({ code: m.code, label: formatMunicipality(m) }));
}
