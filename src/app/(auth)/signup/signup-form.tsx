"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signUp } from "../actions";

const ROLES = [
  { value: "farmer", label: "Produzco", hint: "Vendo mi cosecha" },
  { value: "buyer", label: "Compro", hint: "Mercado, plaza o negocio" },
  { value: "carrier", label: "Transporto", hint: "Tengo camión" },
] as const;

export function SignupForm({ initialRole }: { initialRole: (typeof ROLES)[number]["value"] }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [role, setRole] = useState(initialRole);

  if (state?.ok) {
    return <p className="rounded-[var(--radius)] bg-surface-1 p-4 text-[17px]">{state.ok}</p>;
  }

  const err = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-[13px] text-label-2">Soy</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] bg-surface-1 p-1">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-[8px] px-2 py-2 text-center ${role === r.value ? "bg-surface-3" : ""}`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block text-[15px] font-semibold">{r.label}</span>
              <span className="block text-[11px] text-label-2">{r.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label={role === "buyer" ? "Nombre del negocio" : "Tu nombre"}
        name="displayName"
        autoComplete="name"
        required
        error={err.displayName}
      />
      <Field label="Correo" name="email" type="email" autoComplete="email" required error={err.email} />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="12 o más caracteres, con mayúscula, minúscula, número y símbolo."
        error={err.password}
      />
      <label className="flex items-start gap-3 text-[15px] text-label-2">
        <input type="checkbox" name="terms" className="mt-1 size-4 accent-accent" />
        <span>
          Acepto los{" "}
          <Link href="/legal/terms" className="text-blue">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacy" className="text-blue">
            política de tratamiento de datos
          </Link>{" "}
          (Ley 1581 de 2012).
        </span>
      </label>
      {err.terms && <p className="text-[13px] text-red">{err.terms}</p>}
      {state?.error && (
        <p role="alert" className="text-[15px] text-red">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
      <p className="pt-4 text-center text-[15px] text-label-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-blue">
          Ingresar
        </Link>
      </p>
    </form>
  );
}
