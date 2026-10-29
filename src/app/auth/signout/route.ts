import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST only, so a cross-site <img src="/auth/signout"> can't log people out.
// scope "local" ends this device's session; "Cerrar sesión en todos los
// dispositivos" (S1-05) uses scope "global".
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
