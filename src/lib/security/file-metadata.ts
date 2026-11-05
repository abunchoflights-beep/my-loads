/**
 * Upload hygiene for user files (SECURITY §6, S1-02).
 *
 * - `sniffUpload()` decides the file type from its first bytes, never from the
 *   file name or the browser-sent MIME type.
 * - `stripImageMetadata()` removes EXIF (including GPS), XMP, IPTC and comments
 *   from JPEG, and EXIF and text chunks from PNG, by dropping those segments.
 *   Pixels are untouched: no re-encoding, no image library.
 */

/** File types accepted for identity documents. */
export type UploadKind = "pdf" | "jpg" | "png";

/** A sniffed upload: its kind and the MIME type to store it with. */
export type SniffedUpload = { readonly kind: UploadKind; readonly mime: string };

/** Thrown when an image's structure is broken, so it can't be cleaned safely. */
export class MalformedImageError extends Error {
  constructor() {
    super("MALFORMED_IMAGE");
    this.name = "MalformedImageError";
  }
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const; // "%PDF-"

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((b, i) => bytes[i] === b);
}

/**
 * Identifies a PDF, JPEG or PNG by its magic bytes.
 *
 * @param bytes - The whole file, or at least its first 8 bytes.
 * @returns The kind and MIME type, or null when it is none of the accepted types.
 */
export function sniffUpload(bytes: Uint8Array): SniffedUpload | null {
  if (startsWith(bytes, PDF_SIGNATURE)) return { kind: "pdf", mime: "application/pdf" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: "jpg", mime: "image/jpeg" };
  if (startsWith(bytes, PNG_SIGNATURE)) return { kind: "png", mime: "image/png" };
  return null;
}

/**
 * Removes location and other metadata from a JPEG or PNG. PDFs are returned unchanged.
 *
 * @param bytes - The file contents.
 * @param kind - The sniffed kind (`sniffUpload`).
 * @returns A new array without metadata segments.
 * @throws {MalformedImageError} When a segment length runs past the end of the file.
 */
export function stripImageMetadata(bytes: Uint8Array, kind: UploadKind): Uint8Array {
  switch (kind) {
    case "jpg":
      return stripJpeg(bytes);
    case "png":
      return stripPng(bytes);
    case "pdf":
      return bytes;
  }
}

// JPEG markers kept: APP0 (JFIF), APP2 (ICC color profile), APP14 (Adobe color
// transform). Dropped: APP1 (EXIF/XMP, carries GPS), APP3–APP13 (incl. IPTC in
// APP13), APP15 and COM. Everything else (tables, frame, scan) is image data.
function isJpegMetadata(marker: number): boolean {
  const isApp = marker >= 0xe0 && marker <= 0xef;
  if (isApp) return marker !== 0xe0 && marker !== 0xe2 && marker !== 0xee;
  return marker === 0xfe;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new MalformedImageError();
    const marker = bytes[i + 1];
    if (marker === undefined) throw new MalformedImageError();
    // Start of scan: the rest is entropy-coded image data up to EOI. Keep it all.
    if (marker === 0xda || marker === 0xd9) {
      kept.push(bytes.subarray(i));
      break;
    }
    // Fill byte or standalone marker without a length.
    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const hi = bytes[i + 2];
    const lo = bytes[i + 3];
    if (hi === undefined || lo === undefined) throw new MalformedImageError();
    const end = i + 2 + ((hi << 8) | lo);
    if (end > bytes.length || end < i + 4) throw new MalformedImageError();
    if (!isJpegMetadata(marker)) kept.push(bytes.subarray(i, end));
    i = end;
  }
  return concat(kept);
}

// PNG chunks dropped: eXIf (EXIF, may carry GPS), tEXt/zTXt/iTXt (free text,
// often camera or editor data), tIME (when the photo was edited).
const PNG_METADATA_CHUNKS = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPng(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 8;
  while (i < bytes.length) {
    if (i + 8 > bytes.length) throw new MalformedImageError();
    const length = view.getUint32(i);
    const type = String.fromCharCode(...bytes.subarray(i + 4, i + 8));
    const end = i + 12 + length; // length + type + data + crc
    if (end > bytes.length) throw new MalformedImageError();
    if (!PNG_METADATA_CHUNKS.has(type)) kept.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") break;
  }
  return concat(kept);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
