import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "@/lib/security/csp";

const directive = (csp: string, name: string) =>
  csp.split("; ").find((d) => d.startsWith(name + " "))?.slice(name.length + 1);

describe("buildCsp", () => {
  const prod = buildCsp({ nonce: "abc123", isDev: false, supabaseOrigin: "https://x.supabase.co" });

  it("allows scripts only by nonce + strict-dynamic", () => {
    expect(directive(prod, "script-src")).toBe("'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("never allows inline or eval scripts in production", () => {
    expect(directive(prod, "script-src")).not.toContain("unsafe-inline");
    expect(directive(prod, "script-src")).not.toContain("unsafe-eval");
  });

  it("blocks framing, plugins and base hijacking", () => {
    expect(directive(prod, "frame-ancestors")).toBe("'none'");
    expect(directive(prod, "object-src")).toBe("'none'");
    expect(directive(prod, "base-uri")).toBe("'none'");
  });

  it("lets images load from Supabase Storage", () => {
    expect(directive(prod, "img-src")).toContain("https://x.supabase.co");
  });

  it("upgrades insecure requests in prod only", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    expect(buildCsp({ nonce: "n", isDev: true })).not.toContain("upgrade-insecure-requests");
  });

  it("adds unsafe-eval only in dev", () => {
    expect(directive(buildCsp({ nonce: "n", isDev: true }), "script-src")).toContain("'unsafe-eval'");
  });

  it("creates a fresh nonce every time", () => {
    const a = createNonce();
    expect(a).not.toBe(createNonce());
    expect(a.length).toBeGreaterThanOrEqual(24);
  });
});
