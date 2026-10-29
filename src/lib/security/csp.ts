// Strict, nonce-based Content Security Policy. Built per request in
// src/proxy.ts. Rationale for each directive lives in docs/SECURITY.md §4.

export type CspInput = {
  nonce: string;
  isDev: boolean;
  /** Origin of the Supabase project, for signed Storage image URLs. */
  supabaseOrigin?: string;
};

export function buildCsp({ nonce, isDev, supabaseOrigin }: CspInput): string {
  const img = ["'self'", "blob:", "data:"];
  if (supabaseOrigin) img.push(supabaseOrigin);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic' lets nonce'd Next.js chunks load their own children.
    // React needs eval only for dev-time error stacks.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    // SSR emits style="" attributes (next/image, dev overlay). A nonce can't
    // cover attributes, and style attributes can't execute script.
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": img,
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "report-uri": ["/api/csp-report"],
  };

  const policy = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  // On http://localhost this would upgrade asset URLs to https and break dev.
  if (!isDev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
