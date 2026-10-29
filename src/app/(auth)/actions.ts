"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { safeNextPath } from "@/lib/security/safe-redirect";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: string } | undefined;

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
  next: z.string().optional(),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Revisa el correo y la contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Same message for every failure: never reveal whether the email exists.
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect(safeNextPath(parsed.data.next, "/"));
}

// Mirrors supabase/config.toml: 12+ chars with lower, upper, digit and symbol.
const password = z
  .string()
  .min(12, "Mínimo 12 caracteres.")
  .max(128)
  .regex(/[a-z]/, "Incluye una minúscula.")
  .regex(/[A-Z]/, "Incluye una mayúscula.")
  .regex(/[0-9]/, "Incluye un número.")
  .regex(/[^A-Za-z0-9]/, "Incluye un símbolo.");

const signupSchema = z.object({
  role: z.enum(["farmer", "buyer", "carrier"]),
  displayName: z.string().trim().min(2, "Escribe tu nombre o el de tu negocio.").max(80),
  email: z.email("Correo no válido.").max(254),
  password,
  terms: z.literal("on", { error: "Debes aceptar los términos y la política de datos." }),
});

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by private.handle_new_user(); only farmer|buyer|carrier pass.
      data: { role: parsed.data.role, display_name: parsed.data.displayName },
      emailRedirectTo: `${env().SITE_URL}/auth/confirm`,
    },
  });
  if (error) return { error: "No pudimos crear la cuenta. Intenta de nuevo en un momento." };

  // Same answer whether or not the email was already registered.
  return { ok: "Te enviamos un correo para confirmar tu cuenta. Revisa también spam." };
}
