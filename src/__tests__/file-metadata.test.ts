import { describe, expect, it } from "vite-plus/test";
import { MalformedImageError, sniffUpload, stripImageMetadata } from "@/lib/security/file-metadata";

const ascii = (s: string): number[] => Array.from(new TextEncoder().encode(s));
const text = (bytes: Uint8Array): string => String.fromCharCode(...bytes);

/** A JPEG segment: marker + 2-byte length (which counts itself) + payload. */
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...payload];
}

/** A PNG chunk: length + type + data + a dummy CRC (not validated). */
function chunk(type: string, data: number[]): number[] {
  const n = data.length;
  return [n >>> 24, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, ...ascii(type), ...data, 0, 0, 0, 0];
}

const JPEG = new Uint8Array([
  0xff,
  0xd8,
  ...segment(0xe0, ascii("JFIF\0")),
  ...segment(0xe1, ascii("Exif\0\0GPS 7.88 -76.63")),
  ...segment(0xe1, ascii("http://ns.adobe.com/xap/1.0/\0<xmp/>")),
  ...segment(0xed, ascii("Photoshop 3.0\0IPTC")),
  ...segment(0xfe, ascii("comment")),
  ...segment(0xdb, [0, 1, 2, 3]),
  0xff,
  0xda,
  0x00,
  0x04,
  0x01,
  0x02,
  0xaa,
  0xbb,
  0xff,
  0x00,
  0xcc,
  0xff,
  0xd9,
]);

const PNG = new Uint8Array([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
  ...chunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]),
  ...chunk("tEXt", ascii("Author\0Rosa")),
  ...chunk("eXIf", ascii("MM\0*GPS")),
  ...chunk("iTXt", ascii("XML:com.adobe.xmp")),
  ...chunk("tIME", [7, 234, 11, 5, 3, 0, 0]),
  ...chunk("IDAT", [1, 2, 3]),
  ...chunk("IEND", []),
]);

describe("sniffUpload", () => {
  it("reads the type from the first bytes", () => {
    expect(sniffUpload(new Uint8Array(ascii("%PDF-1.7\n")))).toEqual({
      kind: "pdf",
      mime: "application/pdf",
    });
    expect(sniffUpload(JPEG)).toEqual({ kind: "jpg", mime: "image/jpeg" });
    expect(sniffUpload(PNG)).toEqual({ kind: "png", mime: "image/png" });
  });

  it("rejects anything else, whatever its name says", () => {
    expect(sniffUpload(new Uint8Array(ascii("<html><script>")))).toBeNull();
    expect(sniffUpload(new Uint8Array(ascii("GIF89a")))).toBeNull();
    expect(sniffUpload(new Uint8Array([]))).toBeNull();
  });
});

describe("stripImageMetadata · JPEG", () => {
  const out = stripImageMetadata(JPEG, "jpg");

  it("removes EXIF/GPS, XMP, IPTC and comments", () => {
    for (const leaked of ["Exif", "GPS", "xap", "Photoshop", "comment"]) {
      expect(text(out)).not.toContain(leaked);
    }
  });

  it("keeps JFIF, tables and the image data byte for byte", () => {
    expect(text(out)).toContain("JFIF");
    expect([...out.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    const tail = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0xaa, 0xbb, 0xff, 0x00, 0xcc, 0xff, 0xd9];
    expect([...out.subarray(out.length - tail.length)]).toEqual(tail);
    expect(sniffUpload(out)?.kind).toBe("jpg");
  });

  it("refuses a segment that claims to run past the end", () => {
    const broken = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00, 0x01]);
    expect(() => stripImageMetadata(broken, "jpg")).toThrow(MalformedImageError);
  });
});

describe("stripImageMetadata · PNG", () => {
  const out = stripImageMetadata(PNG, "png");

  it("drops eXIf, text and time chunks, keeps the image chunks in order", () => {
    const types: string[] = [];
    for (let i = 8; i < out.length;) {
      const length = new DataView(out.buffer, out.byteOffset).getUint32(i);
      types.push(text(out.subarray(i + 4, i + 8)));
      i += 12 + length;
    }
    expect(types).toEqual(["IHDR", "IDAT", "IEND"]);
    expect(text(out)).not.toContain("Rosa");
  });

  it("refuses a truncated chunk", () => {
    expect(() => stripImageMetadata(PNG.subarray(0, 20), "png")).toThrow(MalformedImageError);
  });
});

describe("stripImageMetadata · PDF", () => {
  it("returns PDFs unchanged", () => {
    const pdf = new Uint8Array(ascii("%PDF-1.7\n%%EOF"));
    expect(stripImageMetadata(pdf, "pdf")).toBe(pdf);
  });
});
