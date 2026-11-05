import { describe, expect, it } from "vite-plus/test";
import { safeNextPath } from "@/lib/security/safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/farmer/listings", "/farmer/listings"],
    ["/market?product=banano#top", "/market?product=banano#top"],
  ])("keeps same-origin path %s", (input, out) => {
    expect(safeNextPath(input)).toBe(out);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/\nfoo",
    "",
    null,
  ])("rejects %s", (input) => {
    expect(safeNextPath(input, "/home")).toBe("/home");
  });
});
