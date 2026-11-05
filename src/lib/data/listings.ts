import "server-only";

/**
 * Carguitas (listings) reads (S0-08). RLS decides visibility: the market
 * returns published, in-window lots (plus the viewer's own); a farmer sees all
 * of theirs. Municipality names come from the S1-06 foreign-key embed.
 */
import { readFailed } from "@/lib/data/errors";
import { formatMunicipality } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type ListingRow = Tables<"listings">;

/** A row on the market list. */
export type MarketListing = {
  readonly id: string;
  readonly productName: string;
  readonly grade: ListingRow["quality_grade"];
  readonly availableKg: ListingRow["available_kg"];
  readonly pricePerKg: ListingRow["price_cop_per_kg"];
  readonly availableUntil: ListingRow["available_until"];
  readonly municipality: string;
};

/** A row on the farmer's own list. */
export type FarmerListing = {
  readonly id: string;
  readonly productName: string;
  readonly status: ListingRow["status"];
  readonly availableKg: ListingRow["available_kg"];
  readonly quantityKg: ListingRow["quantity_kg"];
  readonly pricePerKg: ListingRow["price_cop_per_kg"];
};

/**
 * Published carguitas still in their window, newest first.
 *
 * @param limit - Page size (filters and paging arrive in S2-03).
 */
export async function listMarketListings(limit = 50): Promise<readonly MarketListing[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, available_kg, price_cop_per_kg, quality_grade, available_until, products(name_es), municipality:municipalities(name, department_name)",
    )
    .eq("status", "published")
    .gte("available_until", today)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) readFailed("MARKET_LISTINGS_READ_FAILED", error);
  return data.map((l) => ({
    id: l.id,
    productName: l.products.name_es,
    grade: l.quality_grade,
    availableKg: l.available_kg,
    pricePerKg: l.price_cop_per_kg,
    availableUntil: l.available_until,
    municipality: formatMunicipality(l.municipality),
  }));
}

/**
 * Every carguita of one farmer, newest first.
 *
 * @param farmerId - The signed-in farmer (RLS would hide others anyway).
 */
export async function listFarmerListings(farmerId: string): Promise<readonly FarmerListing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, status, available_kg, quantity_kg, price_cop_per_kg, products(name_es)")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });
  if (error) readFailed("FARMER_LISTINGS_READ_FAILED", error);
  return data.map((l) => ({
    id: l.id,
    productName: l.products.name_es,
    status: l.status,
    availableKg: l.available_kg,
    quantityKg: l.quantity_kg,
    pricePerKg: l.price_cop_per_kg,
  }));
}

/**
 * How many of the farmer's carguitas are published right now.
 *
 * @param farmerId - The signed-in farmer.
 */
export async function countPublishedListings(farmerId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("farmer_id", farmerId)
    .eq("status", "published");
  if (error) readFailed("PUBLISHED_LISTINGS_COUNT_FAILED", error);
  return count ?? 0;
}
