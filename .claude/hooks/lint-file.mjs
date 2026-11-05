#!/usr/bin/env node
/**
 * PostToolUse (Edit|Write|MultiEdit): formats the edited file, then lints and
 * type-checks it with the constitution rules. Problems are fed back to Claude
 * so they get fixed in the same turn. See AGENTS.md "Enforcement".
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const target = input.tool_input?.file_path ?? input.tool_response?.filePath;
if (!target) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const abs = resolve(root, target);
const rel = relative(root, abs).replaceAll("\\", "/");
if (rel.startsWith("..") || !existsSync(abs) || !/\.(?:[cm]?[jt]sx?)$/.test(rel)) process.exit(0);
if (/^(?:node_modules|\.next|supabase)\//.test(rel)) process.exit(0);

const vp = (...args) => spawnSync("npx", ["--no-install", "vp", ...args], { cwd: root, encoding: "utf8" });

vp("fmt", rel);
const lint = vp("lint", rel);
if (lint.status !== 0) {
  const output = `${lint.stdout}${lint.stderr}`.trim().split("\n").slice(0, 60).join("\n");
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason: `vp lint failed for ${rel}. Fix these before moving on (constitution rules are never disabled to pass):\n${output}`,
    }),
  );
}
