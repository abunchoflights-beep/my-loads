import type { CookieOptions } from "@supabase/ssr";

// Auth cookies are never readable from JavaScript. The browser has no
// Supabase client, so there is nothing client-side that needs them.
export function hardenCookie(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}
