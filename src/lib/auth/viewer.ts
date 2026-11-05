import "server-only";
import { cache } from "react";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, isAppRole, type AppRole } from "@/lib/auth/access";

const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected", "suspended"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type SignedInViewer = {
  id: string;
  email: string | null;
  role: AppRole;
  verification: VerificationStatus;
  aal: "aal1" | "aal2";
  /** Has a verified second factor (`mfa_enrolled` claim, S1-05). */
  mfaEnrolled: boolean;
  /** When this session last passed a TOTP code (Unix seconds), or null. */
  mfaVerifiedAt: number | null;
};

// `amr` lists how this session authenticated. Supabase sends objects with a
// timestamp; RFC 8176 allows bare strings, which carry no time.
const amrSchema = z.array(z.union([z.object({ method: z.string(), timestamp: z.number() }), z.string()]));

/** Latest TOTP verification time in the session's `amr` claim, if any. */
function lastTotpAt(amr: unknown): number | null {
  const parsed = amrSchema.safeParse(amr);
  if (!parsed.success) return null;
  const times = parsed.data.flatMap((entry) =>
    typeof entry !== "string" && (entry.method === "totp" || entry.method === "mfa/totp")
      ? [entry.timestamp]
      : [],
  );
  return times.length ? Math.max(...times) : null;
}

/** Narrows an untrusted JWT claim to a known verification status. */
function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && (VERIFICATION_STATUSES as readonly string[]).includes(value);
}

// getClaims() verifies the JWT signature (ES256 via JWKS) on every call.
// Never use getSession() for authorization on the server: it trusts the cookie.
export const getViewer = cache(async (): Promise<SignedInViewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !isAppRole(claims.user_role)) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: claims.user_role,
    // Claims are UX hints only; RLS reads verification from the database.
    verification: isVerificationStatus(claims.verification) ? claims.verification : "unverified",
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    mfaEnrolled: claims.mfa_enrolled === true,
    mfaVerifiedAt: lastTotpAt(claims.amr),
  };
});

export async function requireRole(...roles: AppRole[]): Promise<SignedInViewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (roles.length && !roles.includes(viewer.role)) redirect(ROLE_HOME[viewer.role]);
  return viewer;
}
