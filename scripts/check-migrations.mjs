#!/usr/bin/env node
/**
 * Enforces "migrations are append-only once merged" (AGENTS.md, Hard rules).
 *
 * Compares supabase/migrations against the base branch (default origin/main,
 * override with MIGRATIONS_BASE_REF) and fails when:
 *   - a migration that exists on the base was modified, renamed or deleted;
 *   - a new migration is not named <14-digit timestamp>_<snake_case>.sql;
 *   - a new migration sorts before the newest migration on the base.
 *
 * Usage: node scripts/check-migrations.mjs   (also part of `npm run check`)
 */
import { execFileSync } from "node:child_process";

const DIR = "supabase/migrations";
const NAME = /^\d{14}_[a-z0-9_]+\.sql$/;

/** Runs git and returns trimmed stdout, or null when git fails. */
function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

const base = process.env.MIGRATIONS_BASE_REF ?? "origin/main";
if (git("rev-parse", "--verify", "--quiet", base) === null) {
  console.warn(`check-migrations: base ref '${base}' not found, skipping (fetch it to enable the check).`);
  process.exit(0);
}

const mergeBase = git("merge-base", base, "HEAD") ?? base;
const onBase = new Set(
  (git("ls-tree", "--name-only", mergeBase, `${DIR}/`) ?? "").split("\n").filter(Boolean),
);
const newestOnBase =
  [...onBase]
    .map((p) => p.slice(DIR.length + 1))
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1) ?? "";

// Working tree + index vs merge base, so it also catches uncommitted edits.
const changes = (git("diff", "--name-status", "--no-renames", mergeBase, "--", `${DIR}/`) ?? "")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [status, path] = line.split("\t");
    return { status, path };
  });
const untracked = (git("ls-files", "--others", "--exclude-standard", "--", `${DIR}/`) ?? "")
  .split("\n")
  .filter(Boolean)
  .map((path) => ({ status: "A", path }));

const problems = [];
for (const { status, path } of [...changes, ...untracked]) {
  if (!path?.endsWith(".sql")) continue;
  const name = path.slice(DIR.length + 1);
  if (onBase.has(path)) {
    problems.push(
      `${path}: merged migrations are append-only (${status === "D" ? "deleted" : "modified"}). Add a new migration instead.`,
    );
    continue;
  }
  if (!NAME.test(name)) problems.push(`${path}: name must be <YYYYMMDDHHMMSS>_<snake_case>.sql.`);
  else if (name <= newestOnBase)
    problems.push(`${path}: must sort after ${newestOnBase}, the newest migration on ${base}.`);
}

if (problems.length) {
  console.error(`check-migrations: ${problems.length} problem(s)\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`check-migrations: ok (${onBase.size} merged on ${base}).`);
