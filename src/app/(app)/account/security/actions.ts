"use server";

/**
 * Server Actions for /account/security (S1-05). Every input is parsed with its
 * zod contract; every result is an ActionResult or a redirect.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, type ActionResult } from "@/lib/action-result";
import { ROLE_HOME } from "@/lib/auth/access";
import {
  confirmTotpEnrollment,
  removeTotpFactor,
  signOutEverywhere,
  startTotpEnrollment,
  verifyTotp,
  type TotpEnrollment,
} from "@/lib/auth/mfa";
import { requireRole } from "@/lib/auth/viewer";
import {
  confirmEnrollmentSchema,
  removeFactorSchema,
  startEnrollmentSchema,
  verifyTotpSchema,
} from "@/lib/schemas/mfa";
import { safeNextPath } from "@/lib/security/safe-redirect";

const firstIssue = (issues: readonly { message: string }[]): string =>
  issues[0]?.message ?? "Revisa el código.";

/**
 * The code challenge after the password (or on an admin page at aal1).
 * On success the session is aal2 and the user goes back to `next`.
 */
export async function verifyCode(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const viewer = await requireRole();
  const parsed = verifyTotpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error.issues), "code");

  const result = await verifyTotp(parsed.data.code);
  if (!result.ok) return result;
  redirect(safeNextPath(parsed.data.next, ROLE_HOME[viewer.role]));
}

/** Step 1 of enrollment: create an unverified factor and return its QR. */
export async function startEnrollment(
  _prev: ActionResult<TotpEnrollment> | undefined,
  formData: FormData,
): Promise<ActionResult<TotpEnrollment>> {
  await requireRole();
  const parsed = startEnrollmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error.issues), "friendlyName");
  return startTotpEnrollment(parsed.data.friendlyName);
}

/** Step 2 of enrollment: confirm the first code. The session becomes aal2. */
export async function confirmEnrollment(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole();
  const parsed = confirmEnrollmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error.issues), "code");

  const result = await confirmTotpEnrollment(parsed.data.factorId, parsed.data.code);
  if (!result.ok) return result;
  revalidatePath("/account/security");
  // An admin who came from /admin goes straight back there.
  redirect(safeNextPath(parsed.data.next, "/account/security"));
}

/** Removes an authenticator app after verifying a current code. */
export async function removeFactor(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const viewer = await requireRole();
  const parsed = removeFactorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error.issues), "code");

  const result = await removeTotpFactor(viewer, parsed.data.factorId, parsed.data.code);
  if (result.ok) revalidatePath("/account/security");
  return result;
}

/** "Cerrar sesión en todos los dispositivos": revokes every refresh token. */
export async function signOutEverywhereAction(): Promise<void> {
  await requireRole();
  await signOutEverywhere();
  redirect("/login");
}
