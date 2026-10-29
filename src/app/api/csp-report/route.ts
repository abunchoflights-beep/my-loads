import { NextResponse, type NextRequest } from "next/server";

// CSP violation sink. Logs a trimmed summary; never echoes input back.
// Ship these logs to observability in S8-03.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 10_000) return new NextResponse(null, { status: 413 });
  try {
    const body = JSON.parse(raw);
    const r = body["csp-report"] ?? body;
    console.warn("[csp]", {
      directive: String(r["violated-directive"] ?? r.effectiveDirective ?? "").slice(0, 100),
      blocked: String(r["blocked-uri"] ?? r.blockedURL ?? "").slice(0, 200),
      page: String(r["document-uri"] ?? r.documentURL ?? "").slice(0, 200),
    });
  } catch {
    // ignore malformed reports
  }
  return new NextResponse(null, { status: 204 });
}
