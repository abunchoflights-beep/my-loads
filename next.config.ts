import type { NextConfig } from "next";

// Static security headers. The CSP is per-request (nonce) and is set in
// src/proxy.ts. See docs/SECURITY.md §4.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Geolocation is needed by carriers for trip tracking (S5). Nothing else.
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Nonce-based CSP requires every page to render per request, so Cache
  // Components / partial prerendering stay off (Next 16 CSP guide).
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // S1-02: the verification form sends up to two 10 MB documents. The proxy
    // buffers request bodies, so its limit has to match the actions' limit.
    serverActions: { bodySizeLimit: "21mb" },
    proxyClientMaxBodySize: "21mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
