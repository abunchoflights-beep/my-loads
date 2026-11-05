import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/security/safe-redirect";

const ALLOWED: ReadonlySet<EmailOtpType> = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "email_change",
  "invite",
]);

function isAllowedOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (ALLOWED as ReadonlySet<string>).has(value);
}

// Email links land here: verifies the one-time token server-side and sets
// the session cookie. ?next= is constrained to same-origin paths.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = isAllowedOtpType(rawType) ? rawType : null;
  const next = safeNextPath(searchParams.get("next"), type === "recovery" ? "/account/security" : "/");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
