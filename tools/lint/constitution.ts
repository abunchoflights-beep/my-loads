/**
 * Constitution lint rules for Mis Carguitas.
 *
 * Each rule enforces one hard rule from AGENTS.md (the project constitution)
 * or docs/SECURITY.md, so a violation fails `vp check` before review instead
 * of in review. Rule tests live in `constitution.test.ts` next to this file.
 *
 * Registered in vite.config.ts under `lint.jsPlugins`; rules are referenced as
 * `constitution/<rule-name>`.
 */
import { definePlugin, defineRule } from "vite-plus/lint/plugins";
import type { Context, ESTree } from "vite-plus/lint/plugins";

type AnyNode = ESTree.Node;

/** Normalizes Windows separators so path regexes work everywhere. */
function fileOf(context: Context): string {
  return context.filename.replaceAll("\\", "/");
}

/** True when the module starts with a `"use client"` directive. */
function isClientModule(program: ESTree.Program): boolean {
  return program.body.some(
    (statement) => statement.type === "ExpressionStatement" && statement.directive === "use client",
  );
}

/** Returns the string value of a Literal or a quasi-only template, otherwise null. */
function staticString(node: AnyNode | null | undefined): string | null {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
  }
  return null;
}

/** Type guard for ESTree nodes found while walking child properties. */
function isNode(value: unknown): value is AnyNode {
  return typeof value === "object" && value !== null && "type" in value && typeof value.type === "string";
}

/** Name of an identifier or string-literal property key, otherwise null. */
function keyName(node: AnyNode): string | null {
  if (node.type === "Identifier") return node.name;
  return staticString(node);
}

// ---------------------------------------------------------------------------
// supabase-server-only
// ---------------------------------------------------------------------------

const SUPABASE_RUNTIME_ALLOWED = [/\/src\/lib\/supabase\//, /\/src\/proxy\.ts$/];
const SERVER_ONLY_MODULES = [
  /^@supabase\//,
  /^@\/lib\/supabase(\/|$)/,
  /^@\/lib\/auth\/viewer$/,
  /^@\/lib\/env$/,
  /^server-only$/,
];

/** No Supabase client in browser code; runtime Supabase imports only in the server client and proxy. */
const supabaseServerOnly = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Supabase is server-only (AGENTS.md §Architecture, SECURITY §2)." },
    messages: {
      clientImport:
        "'{{source}}' is server-only and cannot be imported from a \"use client\" module. Fetch on the server and pass plain props.",
      runtimeImport:
        "Import the Supabase client from '@/lib/supabase/server' (createClient). Runtime '{{source}}' imports are only allowed in src/lib/supabase/ and src/proxy.ts.",
    },
  },
  create(context) {
    const file = fileOf(context);
    let client = false;
    return {
      Program(node) {
        client = isClientModule(node);
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        if (client && SERVER_ONLY_MODULES.some((re) => re.test(source))) {
          context.report({ node: node.source, messageId: "clientImport", data: { source } });
          return;
        }
        const typeOnly =
          node.importKind === "type" ||
          (node.specifiers.length > 0 &&
            node.specifiers.every((s) => s.type === "ImportSpecifier" && s.importKind === "type"));
        if (
          source.startsWith("@supabase/") &&
          !typeOnly &&
          !SUPABASE_RUNTIME_ALLOWED.some((re) => re.test(file))
        ) {
          context.report({ node: node.source, messageId: "runtimeImport", data: { source } });
        }
      },
    };
  },
});

// ---------------------------------------------------------------------------
// no-get-session
// ---------------------------------------------------------------------------

/** getSession() decodes the cookie without verifying it; authorization must use getClaims(). */
const noGetSession = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Never authorize with getSession() (SECURITY §2.4)." },
    messages: {
      noGetSession:
        "getSession() trusts the cookie without verifying the JWT. Use getViewer() / requireRole() (built on getClaims()).",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "MemberExpression" && keyName(callee.property) === "getSession") {
          context.report({ node, messageId: "noGetSession" });
        }
      },
    };
  },
});

// ---------------------------------------------------------------------------
// no-service-role
// ---------------------------------------------------------------------------

const SERVICE_ROLE = /service[_-]?role|sb_secret_/i;

/** The web app never holds the service-role / secret key. */
const noServiceRole = defineRule({
  meta: {
    type: "problem",
    docs: { description: "No service-role key in this app (SECURITY §3.12)." },
    messages: {
      noServiceRole:
        "The web app must not reference the service-role or secret key. Do privileged work inside a SECURITY DEFINER RPC.",
    },
  },
  create(context) {
    const check = (node: AnyNode, text: string): void => {
      if (SERVICE_ROLE.test(text)) context.report({ node, messageId: "noServiceRole" });
    };
    return {
      Identifier(node) {
        check(node, node.name);
      },
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
});

// ---------------------------------------------------------------------------
// rpc-only-lifecycle
// ---------------------------------------------------------------------------

// Tables with no client write grants at all (docs/ARCHITECTURE.md, "Who writes").
const RPC_ONLY_TABLES = new Set(["orders", "loads", "load_bids", "shipment_events", "audit_log"]);
const WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);

/** Lifecycle tables change only through SECURITY DEFINER RPCs (ADR-003). */
const rpcOnlyLifecycle = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Lifecycle changes go through RPCs only (ADR-003, SECURITY §3.3)." },
    messages: {
      rpcOnly:
        "'{{table}}' has no client writes. Call the RPC for this transition with supabase.rpc(...) (see docs/specs/STATE_MACHINES.md).",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression") return;
        const method = keyName(callee.property);
        if (!method || !WRITE_METHODS.has(method)) return;
        const target = callee.object;
        if (target.type !== "CallExpression" || target.callee.type !== "MemberExpression") return;
        if (keyName(target.callee.property) !== "from") return;
        const table = staticString(target.arguments[0]);
        if (table && RPC_ONLY_TABLES.has(table)) {
          context.report({ node, messageId: "rpcOnly", data: { table } });
        }
      },
    };
  },
});

// ---------------------------------------------------------------------------
// require-role
// ---------------------------------------------------------------------------

const APP_PAGE = /\/src\/app\/\(app\)\/(?:.+\/)?(?:page|layout)\.tsx$/;

/** Every signed-in screen re-checks the role on the server (ROUTES.md, gate 2). */
const requireRole = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pages and layouts under src/app/(app) must call requireRole() (ROUTES.md §Gates).",
    },
    messages: {
      missing:
        "Signed-in screens must call `await requireRole(...)` from '@/lib/auth/viewer' so a misconfigured proxy matcher can't expose them.",
    },
  },
  create(context) {
    if (!APP_PAGE.test(fileOf(context))) return {};
    let called = false;
    return {
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "requireRole") called = true;
      },
      "Program:exit"(node: ESTree.Program) {
        if (!called) context.report({ node, messageId: "missing" });
      },
    };
  },
});

// ---------------------------------------------------------------------------
// dynamic-rendering-only
// ---------------------------------------------------------------------------

const STATIC_EXPORTS = new Set(["revalidate", "generateStaticParams"]);
const STATIC_DYNAMIC_VALUES = new Set(["force-static", "error"]);
const CACHE_FLAGS = new Set(["cacheComponents", "ppr", "useCache", "dynamicIO"]);

/** Nonce CSP requires per-request rendering: no static output, no Cache Components / PPR. */
const dynamicRenderingOnly = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Every page renders dynamically for the nonce CSP (ADR-005)." },
    messages: {
      staticExport:
        "'{{name}}' makes this route static or cached. Pages render per request for the nonce CSP (ADR-005).",
      useCache: "'use cache' is not allowed: cached output would carry a stale CSP nonce (ADR-005).",
      cacheFlag: "'{{name}}' stays off: Cache Components / PPR break the per-request nonce CSP (ADR-005).",
    },
  },
  create(context) {
    const isNextConfig = /\/next\.config\.[cm]?[jt]s$/.test(fileOf(context));
    const checkDirectives = (body: readonly AnyNode[]): void => {
      for (const statement of body) {
        if (statement.type === "ExpressionStatement" && statement.directive === "use cache") {
          context.report({ node: statement, messageId: "useCache" });
        }
      }
    };
    return {
      Program(node) {
        checkDirectives(node.body);
      },
      BlockStatement(node) {
        checkDirectives(node.body);
      },
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) return;
        if (decl.type === "FunctionDeclaration" && decl.id && STATIC_EXPORTS.has(decl.id.name)) {
          context.report({ node: decl.id, messageId: "staticExport", data: { name: decl.id.name } });
        }
        if (decl.type !== "VariableDeclaration") return;
        for (const d of decl.declarations) {
          if (d.id.type !== "Identifier") continue;
          const name = d.id.name;
          if (STATIC_EXPORTS.has(name)) {
            context.report({ node: d.id, messageId: "staticExport", data: { name } });
          }
          const value = staticString(d.init);
          if (name === "dynamic" && value && STATIC_DYNAMIC_VALUES.has(value)) {
            context.report({ node: d.id, messageId: "staticExport", data: { name: `dynamic = "${value}"` } });
          }
        }
      },
      Property(node) {
        if (!isNextConfig) return;
        const name = keyName(node.key);
        if (name && CACHE_FLAGS.has(name) && !(node.value.type === "Literal" && node.value.value === false)) {
          context.report({ node: node.key, messageId: "cacheFlag", data: { name } });
        }
      },
    };
  },
});

// ---------------------------------------------------------------------------
// no-inline-script
// ---------------------------------------------------------------------------

/** No inline or third-party scripts: only Next's nonce-stamped bundles run (SECURITY §4). */
const noInlineScript = defineRule({
  meta: {
    type: "problem",
    docs: { description: "No <script> tags or next/script (SECURITY §4)." },
    messages: {
      scriptTag: "No <script> elements. The CSP only runs scripts Next stamps with the request nonce.",
      nextScript:
        "next/script loads extra scripts. Add a third-party script only through a SECURITY.md change first.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "script") {
          context.report({ node, messageId: "scriptTag" });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value === "next/script") context.report({ node, messageId: "nextScript" });
      },
    };
  },
});

// ---------------------------------------------------------------------------
// token-colors-only
// ---------------------------------------------------------------------------

const UTILITIES =
  "bg|text|border|ring|ring-offset|fill|stroke|from|via|to|outline|decoration|divide|placeholder|caret|accent|shadow";
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const RAW_COLOR_PATTERNS: readonly RegExp[] = [
  // Tailwind palette with a shade (bg-red-500). Our tokens have no shade: text-red, bg-surface-1.
  new RegExp(String.raw`(?:^|[\s:])(?:${UTILITIES})-(?:${PALETTE})-\d{2,3}(?:\/\d+)?(?=$|\s)`),
  // Tailwind white/black (use text-label, bg-bg, bg-accent, text-on-accent).
  new RegExp(String.raw`(?:^|[\s:])(?:${UTILITIES})-(?:white|black)(?:\/\d+)?(?=$|\s)`),
  // Arbitrary color values (bg-[#123456], text-[rgb(...)]).
  /-\[(?:#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\()/,
  // Raw color literals in className/style strings.
  /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/,
];
const COLOR_ATTRIBUTES = new Set(["className", "style", "fill", "stroke", "color"]);

/** Colors come only from the tokens in src/app/globals.css (DESIGN.md). */
const tokenColorsOnly = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Colors only from globals.css tokens (DESIGN.md §Color tokens)." },
    messages: {
      rawColor:
        "Raw color '{{match}}'. Use a token utility from src/app/globals.css (bg-surface-1, text-label-2, text-green, ...).",
    },
  },
  create(context) {
    const inspect = (node: AnyNode, text: string): void => {
      for (const re of RAW_COLOR_PATTERNS) {
        const m = re.exec(text);
        if (m) {
          context.report({ node, messageId: "rawColor", data: { match: m[0].trim() } });
          return;
        }
      }
    };
    const walk = (node: unknown): void => {
      if (!isNode(node)) return;
      if (node.type === "Literal" && typeof node.value === "string") inspect(node, node.value);
      else if (node.type === "TemplateElement") inspect(node, node.value.raw);
      for (const [key, child] of Object.entries(node)) {
        if (key === "parent") continue;
        if (Array.isArray(child)) child.forEach(walk);
        else walk(child);
      }
    };
    return {
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && COLOR_ATTRIBUTES.has(node.name.name)) walk(node.value);
      },
    };
  },
});

export default definePlugin({
  meta: { name: "constitution" },
  rules: {
    "supabase-server-only": supabaseServerOnly,
    "no-get-session": noGetSession,
    "no-service-role": noServiceRole,
    "rpc-only-lifecycle": rpcOnlyLifecycle,
    "require-role": requireRole,
    "dynamic-rendering-only": dynamicRenderingOnly,
    "no-inline-script": noInlineScript,
    "token-colors-only": tokenColorsOnly,
  },
});
