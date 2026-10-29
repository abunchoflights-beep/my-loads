import "server-only";
import { z } from "zod";

// Server-only on purpose: the browser never talks to Supabase directly
// (BFF pattern, see docs/SECURITY.md §2), so nothing here is NEXT_PUBLIC_.
const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SITE_URL: z.url(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid environment: ${missing}. Copy .env.example to .env.local.`);
    }
    cached = parsed.data;
  }
  return cached;
}
