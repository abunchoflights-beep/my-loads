import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, isAppRole, type AppRole } from "@/lib/auth/access";

export type SignedInViewer = {
  id: string;
  email: string | null;
  role: AppRole;
  verification: "unverified" | "pending" | "verified" | "rejected" | "suspended";
  aal: "aal1" | "aal2";
};

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
    verification: (claims.verification as SignedInViewer["verification"]) ?? "unverified",
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
  };
});

export async function requireRole(...roles: AppRole[]): Promise<SignedInViewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (roles.length && !roles.includes(viewer.role)) redirect(ROLE_HOME[viewer.role]);
  return viewer;
}
