// Prevents open redirects through ?next=. Only same-origin absolute paths pass.
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Control characters can split headers or confuse URL parsers; reject them outright.
  // oxlint-disable-next-line no-control-regex -- matching control characters is the point.
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  try {
    const url = new URL(next, "http://x.invalid");
    if (url.origin !== "http://x.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
