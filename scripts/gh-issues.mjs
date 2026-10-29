// Creates GitHub labels, milestones and issues from docs/specs/S*/*.md.
// Idempotent: skips issues whose title already exists (open or closed).
//
//   gh auth login                      # once
//   npm run gh:issues -- --dry-run     # preview
//   npm run gh:issues                  # create
//
// Uses the repo of the current directory (git remote "origin").
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const SPECS = new URL("../docs/specs/", import.meta.url).pathname;

const gh = (args, input) =>
  execFileSync("gh", args, { encoding: "utf8", input, stdio: [input ? "pipe" : "ignore", "pipe", "inherit"] });

function parse(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`No front matter in ${file}`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const [, k, v] = line.match(/^(\w+):\s*(.*)$/) ?? [];
    if (!k) continue;
    meta[k] = v.startsWith("[") ? v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean) : v.replace(/^"|"$/g, "");
  }
  // Drop the H1 (GitHub shows the title already).
  const body = m[2].replace(/^\s*# .*\n/, "").trim();
  return { ...meta, body };
}

const specs = readdirSync(SPECS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^S\d+$/.test(d.name))
  .flatMap((d) => readdirSync(join(SPECS, d.name)).filter((f) => f.endsWith(".md")).map((f) => join(SPECS, d.name, f)))
  .sort()
  .map(parse);

console.log(`${specs.length} specs found${DRY ? " (dry run)" : ""}`);

const labels = [...new Set(specs.flatMap((s) => s.labels))];
const milestones = [...new Set(specs.map((s) => s.milestone))];

if (!DRY) {
  const existingLabels = new Set(JSON.parse(gh(["label", "list", "--limit", "500", "--json", "name"])).map((l) => l.name));
  for (const name of labels) {
    if (!existingLabels.has(name)) gh(["label", "create", name, "--color", name === "spec" ? "000000" : "5a5a5e"]);
  }

  const existingMilestones = new Set(
    JSON.parse(gh(["api", "repos/{owner}/{repo}/milestones?state=all&per_page=100"])).map((m) => m.title),
  );
  for (const title of milestones) {
    if (!existingMilestones.has(title)) gh(["api", "repos/{owner}/{repo}/milestones", "-f", `title=${title}`]);
  }
}

const existingTitles = DRY
  ? new Set()
  : new Set(JSON.parse(gh(["issue", "list", "--state", "all", "--limit", "1000", "--json", "title"])).map((i) => i.title));

for (const s of specs) {
  const title = `${s.id} · ${s.title}`;
  if (existingTitles.has(title)) {
    console.log(`skip   ${title}`);
    continue;
  }
  if (DRY) {
    console.log(`would create  ${title}  [${s.milestone}] {${s.labels.join(", ")}}`);
    continue;
  }
  const url = gh(
    ["issue", "create", "--title", title, "--body-file", "-", "--milestone", s.milestone, ...s.labels.flatMap((l) => ["--label", l])],
    s.body + `\n\n---\nSource: \`docs/specs/S${s.sprint}/\``,
  ).trim();
  console.log(`create ${title}  ${url}`);
}
