#!/usr/bin/env node
/**
 * Stop hook: when the working tree has code changes, runs `npm run check`
 * (format, lint, types, unit tests, migration guard) and blocks the stop
 * until it is green. See AGENTS.md "Enforcement" and "Validation".
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();

const status = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
const changed = status.stdout
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3))
  .filter((path) => /\.(?:[cm]?[jt]sx?|css|json|sql)$/.test(path) && !path.endsWith("package-lock.json"));
if (changed.length === 0) process.exit(0);

const check = spawnSync("npm", ["run", "--silent", "check"], { cwd: root, encoding: "utf8" });
if (check.status === 0) process.exit(0);

const output = `${check.stdout}${check.stderr}`.trim().split("\n").slice(-60).join("\n");
if (input.stop_hook_active) {
  // Already blocked once this turn: surface the failure instead of looping.
  process.stdout.write(JSON.stringify({ systemMessage: `npm run check is still failing:\n${output}` }));
  process.exit(0);
}
process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason: `npm run check failed. The task is not done until it is green (AGENTS.md, Validation):\n${output}`,
  }),
);
