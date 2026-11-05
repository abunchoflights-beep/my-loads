/**
 * Output contract for Server Actions (AGENTS.md, "Contract first").
 *
 * Every action returns an `ActionResult<T>` instead of throwing, so forms can
 * render the Spanish message next to the right field. `redirect()` and
 * `notFound()` still propagate as usual.
 */

/** Success or a user-facing failure. `error` is Spanish copy, never raw database text. */
export type ActionResult<T = undefined> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: string; readonly field?: string };

/**
 * Builds a successful result.
 *
 * @param data - The payload the form or caller needs next.
 */
export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * Builds a failed result with a message for the user.
 *
 * @param error - Spanish (es-CO, tú) message that says what to do next.
 * @param field - Form field the message belongs to, if any.
 */
export function fail(error: string, field?: string): ActionResult<never> {
  return field === undefined ? { ok: false, error } : { ok: false, error, field };
}
