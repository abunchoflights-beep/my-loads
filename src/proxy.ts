import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { buildCsp, createNonce } from "@/lib/security/csp";
import { hardenCookie } from "@/lib/security/cookies";
import { isAppRole, resolveAccess, type Viewer } from "@/lib/auth/access";
import type { Database } from "@/lib/supabase/database.types";

// Runs before every page request:
//   1. fresh CSP nonce
//   2. refresh the Supabase session (rotating refresh token) and verify the JWT
//   3. first-pass route gate by role (docs/ROUTES.md)
export async function proxy(request: NextRequest) {
  const nonce = createNonce();
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    supabaseOrigin: supabaseUrl ? new URL(supabaseUrl).origin : undefined,
  });

  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];
  let cacheHeaders: Record<string, string> = {};
  let viewer: Viewer = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies, headers) {
          for (const c of cookies) {
            request.cookies.set(c.name, c.value);
            cookiesToSet.push(c);
          }
          cacheHeaders = { ...cacheHeaders, ...headers };
        },
      },
    });

    // Do not put code between createServerClient and getClaims: a refresh
    // must happen before anything reads the session.
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (claims?.sub && isAppRole(claims.user_role)) {
      viewer = {
        role: claims.user_role,
        aal: claims.aal === "aal2" ? "aal2" : "aal1",
        mfa: claims.mfa_enrolled === true,
      };
    }
  }

  const decision = resolveAccess(request.nextUrl.pathname, viewer);

  let response: NextResponse;
  if (decision.kind === "redirect") {
    response = NextResponse.redirect(new URL(decision.to, request.url));
  } else {
    // Headers are copied after the cookie refresh so server components see
    // the new session for this same request.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, hardenCookie(options));
  }
  for (const [key, value] of Object.entries(cacheHeaders)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and the CSP report sink.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|api/csp-report).*)",
  ],
};
