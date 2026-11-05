import "server-only";

/**
 * Shared failure handling for the data layer (AGENTS.md, Error handling).
 * Logs only the stable code and the Postgres/PostgREST error code, never
 * the message (which can contain values) or any PII.
 */

/** A Postgres/PostgREST error as returned by supabase-js. */
export type DbError = { readonly code?: string } | null;

/**
 * Fails a read: logs the code and throws, so the route's error boundary shows.
 *
 * @param code - Stable UPPER_SNAKE code naming the read, e.g. "LISTINGS_READ_FAILED".
 * @param error - The supabase-js error.
 * @throws {Error} Always, with `code` as the message.
 */
export function readFailed(code: string, error: DbError): never {
  console.error(code, error?.code ?? "unknown");
  throw new Error(code);
}

/** Postgres error codes the data layer maps to Spanish messages. */
export const PG = {
  foreignKeyViolation: "23503",
  uniqueViolation: "23505",
  insufficientPrivilege: "42501",
  invalidParameter: "22023",
} as const;
