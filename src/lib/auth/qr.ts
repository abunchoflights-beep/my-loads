/**
 * Turns the enrollment QR that Supabase returns (raw SVG markup, with or
 * without a `data:` prefix) into a percent-encoded data URI for an `<img>`.
 * The SVG is never injected into the DOM as markup (SECURITY §4: no
 * dangerouslySetInnerHTML), and `data:` images are already allowed by the CSP.
 *
 * @param qr - `totp.qr_code` from `auth.mfa.enroll()`.
 * @returns A `data:image/svg+xml` URI safe to use as an image source.
 */
export function qrToDataUri(qr: string): string {
  let svg = qr.startsWith("data:") ? qr.slice(qr.indexOf(",") + 1) : qr;
  if (!svg.trimStart().startsWith("<")) {
    try {
      svg = decodeURIComponent(svg);
    } catch {
      // Not percent-encoded after all; keep it as is.
    }
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
