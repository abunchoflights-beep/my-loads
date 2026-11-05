import { describe, expect, it } from "vite-plus/test";
import { qrToDataUri } from "@/lib/auth/qr";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z" fill="#000"/></svg>';
const PREFIX = "data:image/svg+xml;charset=utf-8,";

describe("qrToDataUri (S1-05)", () => {
  it("encodes raw SVG markup", () => {
    const uri = qrToDataUri(SVG);
    expect(uri.startsWith(PREFIX)).toBe(true);
    expect(decodeURIComponent(uri.slice(PREFIX.length))).toBe(SVG);
    expect(uri).not.toContain("<");
    expect(uri).not.toContain("#");
  });

  it("accepts Supabase's unencoded data: prefix", () => {
    expect(qrToDataUri(`data:image/svg+xml;utf-8,${SVG}`)).toBe(qrToDataUri(SVG));
  });

  it("accepts an already percent-encoded payload", () => {
    expect(qrToDataUri(`data:image/svg+xml;utf-8,${encodeURIComponent(SVG)}`)).toBe(qrToDataUri(SVG));
  });
});
