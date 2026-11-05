// Creates supabase/signing_keys.json (ES256 private JWK) for local dev.
// The file is gitignored. Production keys are created in the Supabase
// dashboard (Settings → JWT Keys), never committed.
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const target = new URL("../supabase/signing_keys.json", import.meta.url);
if (existsSync(target) && !process.argv.includes("--force")) {
  console.log("supabase/signing_keys.json already exists (use --force to replace).");
  process.exit(0);
}

// Run outside the project: inside it the CLI tries to read the (missing)
// signing_keys_path from config.toml and fails.
const cli = fileURLToPath(new URL("../node_modules/.bin/supabase", import.meta.url));
const out = execFileSync(cli, ["gen", "signing-key", "--algorithm", "ES256"], {
  encoding: "utf8",
  cwd: tmpdir(),
});
const jwkLine = out.split("\n").find((l) => l.trim().startsWith("{"));
if (!jwkLine) throw new Error("Could not read the generated key from the Supabase CLI output.");
const jwk = JSON.parse(jwkLine);
if (jwk.kty !== "EC" || !jwk.d) throw new Error("Unexpected key format.");

writeFileSync(target, JSON.stringify([jwk], null, 2) + "\n", { mode: 0o600 });
console.log(`Wrote supabase/signing_keys.json (kid ${jwk.kid}).`);
