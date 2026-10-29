import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { hardenCookie } from "@/lib/security/cookies";

// One client per request. Runs as the signed-in user, so RLS applies.
// There is deliberately no service-role client in the web app.
export async function createClient() {
  const cookieStore = await cookies();
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = env();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, hardenCookie(options));
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // src/proxy.ts already refreshed the session for this request.
        }
      },
    },
  });
}
