import "server-only";

/**
 * Orders (pedidos) reads (S0-08). Orders change only through RPCs (ADR-003);
 * RLS shows each party only their own orders.
 */
import { readFailed } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Orders waiting for this farmer's answer.
 *
 * @param farmerId - The signed-in farmer.
 */
export async function countPendingOrdersForFarmer(farmerId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("farmer_id", farmerId)
    .eq("status", "pending");
  if (error) readFailed("PENDING_ORDERS_COUNT_FAILED", error);
  return count ?? 0;
}
