// Route access matrix. Used by src/proxy.ts (first gate) and requireRole()
// in server components (second gate). The database RLS is the real gate;
// these two only keep people out of screens that would be empty for them.
// Keep in sync with docs/ROUTES.md.

export const ROLES = ["farmer", "buyer", "carrier", "admin"] as const;
export type AppRole = (typeof ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export const ROLE_HOME: Record<AppRole, string> = {
  farmer: "/farmer",
  buyer: "/market",
  carrier: "/loads",
  admin: "/admin",
};

const PUBLIC_PREFIXES = ["/login", "/signup", "/auth", "/legal", "/forgot-password"];

// Longest prefix wins, so list specific paths before their parents if they differ.
const RULES: { prefix: string; roles: readonly AppRole[] }[] = [
  { prefix: "/farmer", roles: ["farmer"] },
  { prefix: "/market", roles: ["buyer", "farmer", "admin"] },
  { prefix: "/buyer", roles: ["buyer"] },
  { prefix: "/loads", roles: ["carrier"] },
  { prefix: "/trips", roles: ["carrier"] },
  { prefix: "/vehicles", roles: ["carrier"] },
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/account", roles: ROLES },
];

export type Viewer = { role: AppRole; aal: "aal1" | "aal2" } | null;

export type AccessDecision = { kind: "allow" } | { kind: "redirect"; to: string };

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function resolveAccess(pathname: string, viewer: Viewer): AccessDecision {
  if (pathname === "/") {
    return viewer ? { kind: "redirect", to: ROLE_HOME[viewer.role] } : { kind: "allow" };
  }

  if (PUBLIC_PREFIXES.some((p) => matches(pathname, p))) {
    // Signed-in users don't need the login/signup screens.
    if (viewer && (matches(pathname, "/login") || matches(pathname, "/signup"))) {
      return { kind: "redirect", to: ROLE_HOME[viewer.role] };
    }
    return { kind: "allow" };
  }

  const rule = RULES.filter((r) => matches(pathname, r.prefix)).toSorted(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];

  // Unknown paths fall through to Next's 404, but only for signed-in users.
  if (!viewer) {
    return { kind: "redirect", to: `/login?next=${encodeURIComponent(pathname)}` };
  }
  if (!rule) return { kind: "allow" };
  if (!rule.roles.includes(viewer.role)) {
    return { kind: "redirect", to: ROLE_HOME[viewer.role] };
  }
  // Admin screens need a second factor in this session.
  if (rule.prefix === "/admin" && viewer.aal !== "aal2") {
    return { kind: "redirect", to: `/account/security?next=${encodeURIComponent(pathname)}` };
  }
  return { kind: "allow" };
}
