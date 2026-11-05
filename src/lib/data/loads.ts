import "server-only";

/**
 * Load board reads (S0-08). RLS shows posted loads only to verified carriers,
 * and only by municipality: exact stops stay private until booking (ADR-006).
 */
import { readFailed } from "@/lib/data/errors";
import { formatMunicipality } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type LoadRow = Tables<"loads">;

/** A row on the load board. */
export type BoardLoad = {
  readonly id: string;
  readonly productName: string;
  readonly weightKg: LoadRow["weight_kg"];
  readonly requiredBody: LoadRow["required_body"];
  readonly pickupOn: LoadRow["pickup_on"];
  readonly targetRateCop: LoadRow["target_rate_cop"];
  readonly origin: string;
  readonly destination: string;
};

/**
 * Posted loads, earliest pickup first.
 *
 * @param limit - Page size (lane filters arrive in S4-01).
 */
export async function listPostedLoads(limit = 50): Promise<readonly BoardLoad[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loads")
    // One literal: supabase-js parses it at the type level to type each row.
    .select(
      "id, weight_kg, required_body, pickup_on, target_rate_cop, products(name_es), origin:municipalities!loads_origin_municipality_fk(name, department_name), destination:municipalities!loads_destination_municipality_fk(name, department_name)",
    )
    .eq("status", "posted")
    .order("pickup_on")
    .limit(limit);
  if (error) readFailed("POSTED_LOADS_READ_FAILED", error);
  return data.map((l) => ({
    id: l.id,
    productName: l.products.name_es,
    weightKg: l.weight_kg,
    requiredBody: l.required_body,
    pickupOn: l.pickup_on,
    targetRateCop: l.target_rate_cop,
    origin: formatMunicipality(l.origin),
    destination: formatMunicipality(l.destination),
  }));
}
