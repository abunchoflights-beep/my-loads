import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { searchMunicipalities } from "@/lib/data/municipalities";
import { municipalitySearchSchema } from "@/lib/schemas/municipalities";

/**
 * GET /api/municipalities?q=apar (S1-06): picker suggestions for signed-in
 * users. 200 with up to 20 `{ code, label }`, 400 for a bad query, 401
 * without a session (the proxy already redirects, this is the second gate).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const parsed = municipalitySearchSchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: "QUERY_INVALID" }, { status: 400 });

  const options = await searchMunicipalities(parsed.data.q);
  // Reference data: let the browser reuse a result for a few minutes, never a shared cache.
  return NextResponse.json(options, { status: 200, headers: { "Cache-Control": "private, max-age=300" } });
}
