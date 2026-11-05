/**
 * Rule tests for the constitution lint plugin. One block per rule: the valid
 * cases are patterns the codebase relies on, the invalid ones are the
 * violations the rule exists to stop.
 */
import { RuleTester } from "vite-plus/lint/plugins-dev";
import { describe, it } from "vite-plus/test";
import plugin from "./constitution";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();
const rules = plugin.rules;

function rule(name: string): NonNullable<typeof rules>[string] {
  const found = rules?.[name];
  if (!found) throw new Error(`Unknown rule ${name}`);
  return found;
}

const APP_PAGE = "/repo/src/app/(app)/market/page.tsx";

tester.run("supabase-server-only", rule("supabase-server-only"), {
  valid: [
    {
      code: `import { createServerClient } from "@supabase/ssr";`,
      filename: "/repo/src/lib/supabase/server.ts",
    },
    { code: `import { createServerClient } from "@supabase/ssr";`, filename: "/repo/src/proxy.ts" },
    {
      code: `import type { EmailOtpType } from "@supabase/supabase-js";`,
      filename: "/repo/src/app/auth/confirm/route.ts",
    },
    { code: `import { createClient } from "@/lib/supabase/server";`, filename: APP_PAGE },
    { code: `"use client";\nimport { useState } from "react";`, filename: "/repo/src/components/x.tsx" },
  ],
  invalid: [
    {
      code: `import { createClient } from "@supabase/supabase-js";`,
      filename: APP_PAGE,
      errors: [{ messageId: "runtimeImport" }],
    },
    {
      code: `"use client";\nimport { createClient } from "@/lib/supabase/server";`,
      filename: "/repo/src/components/x.tsx",
      errors: [{ messageId: "clientImport" }],
    },
    {
      code: `"use client";\nimport type { CookieOptions } from "@supabase/ssr";`,
      filename: "/repo/src/components/x.tsx",
      errors: [{ messageId: "clientImport" }],
    },
    {
      code: `"use client";\nimport { getViewer } from "@/lib/auth/viewer";`,
      filename: "/repo/src/components/x.tsx",
      errors: [{ messageId: "clientImport" }],
    },
  ],
});

tester.run("no-get-session", rule("no-get-session"), {
  valid: [`await supabase.auth.getClaims();`, `await supabase.auth.getUser();`],
  invalid: [{ code: `await supabase.auth.getSession();`, errors: [{ messageId: "noGetSession" }] }],
});

tester.run("no-service-role", rule("no-service-role"), {
  valid: [`const key = process.env.SUPABASE_PUBLISHABLE_KEY;`],
  invalid: [
    { code: `const key = process.env.SUPABASE_SERVICE_ROLE_KEY;`, errors: 1 },
    { code: `const key = "sb_secret_abc";`, errors: 1 },
    { code: "const role = `service_role`;", errors: 1 },
  ],
});

tester.run("rpc-only-lifecycle", rule("rpc-only-lifecycle"), {
  valid: [
    `await supabase.rpc("respond_to_order", { order_id: id, accept: true });`,
    `await supabase.from("orders").select("id");`,
    `await supabase.from("listings").update({ title });`,
    `await supabase.from("vehicles").insert(row);`,
  ],
  invalid: [
    {
      code: `await supabase.from("orders").update({ status: "accepted" });`,
      errors: [{ messageId: "rpcOnly" }],
    },
    { code: `await supabase.from("loads").insert(row);`, errors: [{ messageId: "rpcOnly" }] },
    { code: `await supabase.from("load_bids").upsert(row);`, errors: [{ messageId: "rpcOnly" }] },
    { code: `await supabase.from("audit_log").delete();`, errors: [{ messageId: "rpcOnly" }] },
  ],
});

tester.run("require-role", rule("require-role"), {
  valid: [
    {
      code: `export default async function P() { await requireRole("buyer"); return null; }`,
      filename: APP_PAGE,
    },
    { code: `export default function P() { return null; }`, filename: "/repo/src/app/(auth)/login/page.tsx" },
    { code: `export function helper() {}`, filename: "/repo/src/app/(app)/market/helpers.ts" },
  ],
  invalid: [
    {
      code: `export default async function P() { return null; }`,
      filename: APP_PAGE,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `export default async function L({ children }) { return children; }`,
      filename: "/repo/src/app/(app)/layout.tsx",
      errors: [{ messageId: "missing" }],
    },
  ],
});

tester.run("dynamic-rendering-only", rule("dynamic-rendering-only"), {
  valid: [
    `export const dynamic = "force-dynamic";`,
    `export const metadata = { title: "x" };`,
    { code: `export default { poweredByHeader: false };`, filename: "/repo/next.config.ts" },
    { code: `export default { cacheComponents: false };`, filename: "/repo/next.config.ts" },
  ],
  invalid: [
    { code: `export const dynamic = "force-static";`, errors: [{ messageId: "staticExport" }] },
    { code: `export const revalidate = 60;`, errors: [{ messageId: "staticExport" }] },
    {
      code: `export async function generateStaticParams() { return []; }`,
      errors: [{ messageId: "staticExport" }],
    },
    { code: `"use cache";\nexport default function P() {}`, errors: [{ messageId: "useCache" }] },
    { code: `async function f() { "use cache"; return 1; }`, errors: [{ messageId: "useCache" }] },
    {
      code: `export default { cacheComponents: true };`,
      filename: "/repo/next.config.ts",
      errors: [{ messageId: "cacheFlag" }],
    },
  ],
});

tester.run("no-inline-script", rule("no-inline-script"), {
  valid: [{ code: `const a = <div>ok</div>;`, filename: "/repo/src/a.tsx" }],
  invalid: [
    {
      code: `const a = <script>alert(1)</script>;`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "scriptTag" }],
    },
    {
      code: `import Script from "next/script";`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "nextScript" }],
    },
  ],
});

tester.run("token-colors-only", rule("token-colors-only"), {
  valid: [
    { code: `<div className="bg-surface-1 text-label-2 border-separator" />`, filename: "/repo/src/a.tsx" },
    { code: `<p className="text-red text-green text-blue text-orange" />`, filename: "/repo/src/a.tsx" },
    {
      code: `<div className="rounded-[var(--radius-lg)] bg-bg/80 md:bg-surface-2" />`,
      filename: "/repo/src/a.tsx",
    },
    { code: `<a href="#main" className="text-blue" />`, filename: "/repo/src/a.tsx" },
    {
      code: '<div className={`bg-surface-1 ${active ? "text-label" : "text-label-2"}`} />',
      filename: "/repo/src/a.tsx",
    },
  ],
  invalid: [
    {
      code: `<div className="bg-red-500" />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: `<div className="hover:text-gray-400" />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: `<div className="bg-black/80" />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: `<div className="text-white" />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: `<div className="bg-[#1c1c1e]" />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: `<div style={{ color: "#fff" }} />`,
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
    {
      code: '<div className={`p-2 ${on ? "bg-blue-600" : ""}`} />',
      filename: "/repo/src/a.tsx",
      errors: [{ messageId: "rawColor" }],
    },
  ],
});
