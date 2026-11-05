import "server-only";

/**
 * Two-step verification with an authenticator app (S1-05). Every call runs on
 * the server as the signed-in user through Supabase Auth's MFA API; TOTP
 * secrets and QR codes are never logged.
 */
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { qrToDataUri } from "@/lib/auth/qr";
import type { SignedInViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

/** A verified authenticator app on the account. */
export type TotpFactor = { readonly id: string; readonly name: string; readonly createdAt: string };

/** What the enrollment screen needs to show the QR and the manual key. */
export type TotpEnrollment = {
  readonly factorId: string;
  readonly qrDataUri: string;
  readonly secret: string;
};

// Supabase Auth error codes → what to tell the user.
const MFA_MESSAGES: Readonly<Record<string, string>> = {
  mfa_verification_failed: "Código incorrecto o vencido. Escribe el que muestra tu app ahora.",
  mfa_challenge_expired: "El código venció. Escribe el que muestra tu app ahora.",
  too_many_enrolled_mfa_factors: "Ya tienes el máximo de apps. Quita una antes de agregar otra.",
  mfa_factor_name_conflict: "Ya tienes una app con ese nombre. Usa otro.",
  insufficient_aal: "Confirma un código de tu app antes de hacer este cambio.",
  over_request_rate_limit: "Demasiados intentos. Espera un minuto y vuelve a intentar.",
};
const GENERIC_MESSAGE = "No pudimos completar la verificación. Intenta de nuevo.";

/**
 * Maps a Supabase Auth error code to Spanish copy.
 *
 * @param code - `AuthError.code`, if any.
 */
export function mfaMessage(code: string | undefined): string {
  return (code && MFA_MESSAGES[code]) || GENERIC_MESSAGE;
}

/** Lists the account's verified authenticator apps, oldest first. */
export async function listTotpFactors(): Promise<readonly TotpFactor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    console.error("MFA_LIST_FAILED", error.code);
    return [];
  }
  return data.totp
    .map((f) => ({ id: f.id, name: f.friendly_name ?? "App autenticadora", createdAt: f.created_at }))
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Starts enrolling a new authenticator app. Abandoned (unverified) factors from
 * earlier attempts are removed first so they don't pile up.
 *
 * @param friendlyName - Tells devices apart ("Mi celular").
 */
export async function startTotpEnrollment(friendlyName: string): Promise<ActionResult<TotpEnrollment>> {
  const supabase = await createClient();
  const listed = await supabase.auth.mfa.listFactors();
  const abandoned = (listed.data?.all ?? []).filter(
    (f) => f.factor_type === "totp" && f.status === "unverified",
  );
  await Promise.all(abandoned.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName });
  if (error) return fail(mfaMessage(error.code));
  return ok({ factorId: data.id, qrDataUri: qrToDataUri(data.totp.qr_code), secret: data.totp.secret });
}

/**
 * Confirms a new factor with its first code. On success the session is `aal2`.
 *
 * @param factorId - From `startTotpEnrollment`.
 * @param code - 6 digits from the app.
 */
export async function confirmTotpEnrollment(factorId: string, code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  return error ? fail(mfaMessage(error.code), "code") : ok(undefined);
}

/**
 * Passes the code challenge with any of the user's verified apps, raising the
 * session to `aal2`.
 *
 * @param code - 6 digits from any enrolled app.
 */
export async function verifyTotp(code: string): Promise<ActionResult> {
  const factors = await listTotpFactors();
  if (factors.length === 0) return fail("No tienes una app autenticadora configurada.");
  const supabase = await createClient();
  let lastCode: string | undefined;
  for (const factor of factors) {
    // Sequential on purpose: stop at the first app that accepts the code, so
    // the user's other factors don't collect failed attempts.
    // oxlint-disable-next-line no-await-in-loop -- see above
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (!error) return ok(undefined);
    lastCode = error.code;
  }
  return fail(mfaMessage(lastCode), "code");
}

/**
 * Removes an authenticator app. A current code is verified in the same request,
 * so removal never relies on an old `aal2` (S1-05 invariant). Admins must keep
 * at least one factor.
 *
 * @param viewer - The signed-in user.
 * @param factorId - The factor to remove; must be one of the user's.
 * @param code - A current code from any enrolled app.
 */
export async function removeTotpFactor(
  viewer: SignedInViewer,
  factorId: string,
  code: string,
): Promise<ActionResult> {
  const factors = await listTotpFactors();
  if (!factors.some((f) => f.id === factorId)) return fail("Esa app ya no está en tu cuenta.");
  if (viewer.role === "admin" && factors.length === 1) {
    return fail("Como administrador necesitas al menos una app. Agrega otra antes de quitar esta.");
  }
  const verified = await verifyTotp(code);
  if (!verified.ok) return verified;
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error ? fail(mfaMessage(error.code)) : ok(undefined);
}

/** Revokes every session of the account on every device (`scope: global`). */
export async function signOutEverywhere(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) console.error("SIGN_OUT_GLOBAL_FAILED", error.code);
}
