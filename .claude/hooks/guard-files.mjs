#!/usr/bin/env node
/**
 * PreToolUse guard (Edit|Write|MultiEdit|NotebookEdit). Denies:
 *   - edits to a migration already merged to origin/main (append-only rule);
 *   - writes to .env files other than .env.example (secrets never go in the repo or chat).
 * See AGENTS.md "Enforcement".
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
if (!target) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const rel = relative(root, resolve(root, target)).replaceAll("\\", "/");

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

const name = basename(rel);
if (name.startsWith(".env") && name !== ".env.example") {
  deny(
    `${rel} holds secrets and is never written by an agent. Ask the user to set the value themselves (SECURITY §7).`,
  );
}

if (/^supabase\/migrations\/[^/]+\.sql$/.test(rel)) {
  try {
    execFileSync("git", ["cat-file", "-e", `origin/main:${rel}`], { cwd: root, stdio: "ignore" });
    deny(
      `${rel} is merged on main and migrations are append-only. Create a new migration with a later timestamp instead (AGENTS.md, Hard rules).`,
    );
  } catch {
    // Not on main (new migration) or no origin/main: allowed.
  }
}
