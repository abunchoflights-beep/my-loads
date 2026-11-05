import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { hardenCookie } from "@/lib/security/cookies";

/** The app's Supabase client, typed against the generated schema (S0-08). */
export type AppSupabaseClient = ReturnType<typeof createServerClient<Database>>;

/**
 * One client per request, typed with the generated `Database` (S0-08). Runs as
 * the signed-in user, so RLS applies. There is deliberately no service-role
 * client in the web app.
 */
export async function createClient(): Promise<AppSupabaseClient> {
  const cookieStore = await cookies();
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = env();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
