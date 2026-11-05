"use client";

/**
 * Interactive pieces of /account/security (S1-05). All logic runs in the
 * Server Actions; these components only hold form state.
 */
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { TotpEnrollment } from "@/lib/auth/mfa";
import { confirmEnrollment, removeFactor, startEnrollment, verifyCode } from "./actions";

const codeInputProps = {
  name: "code",
  inputMode: "numeric",
  autoComplete: "one-time-code",
  maxLength: 7,
  placeholder: "123 456",
  required: true,
} as const;

/** The 6-digit challenge that raises the session to aal2. */
export function ChallengeForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(verifyCode, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field
        label="Código de tu app"
        {...codeInputProps}
        error={state && !state.ok ? state.error : undefined}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verificando…" : "Continuar"}
      </Button>
    </form>
  );
}

/** Two steps: name the device and get a QR, then confirm the first code. */
export function EnrollFlow({ next, hasFactors }: { next?: string; hasFactors: boolean }) {
  const [started, startAction, starting] = useActionState(startEnrollment, undefined);
  const [confirmed, confirmAction, confirming] = useActionState(confirmEnrollment, undefined);
  const enrollment: TotpEnrollment | null = started?.ok ? started.data : null;

  if (!enrollment) {
    return (
      <form action={startAction} className="space-y-4">
        <Field
          label="Nombre del dispositivo"
          name="friendlyName"
          defaultValue={hasFactors ? "Celular de respaldo" : "Mi celular"}
          maxLength={40}
          required
          error={started && !started.ok ? started.error : undefined}
        />
        <Button
          type="submit"
          variant={hasFactors ? "secondary" : "primary"}
          className="w-full"
          disabled={starting}
        >
          {hasFactors ? "Agregar otra app" : "Activar con una app autenticadora"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-2 text-[15px] text-label-2">
        <li>1. Abre tu app autenticadora (Google Authenticator, Microsoft Authenticator u otra).</li>
        <li>2. Escanea este código.</li>
        <li>3. Escribe los 6 números que te muestra.</li>
      </ol>
      {/* A data: URI from Supabase; next/image adds nothing for an inline SVG. */}
      {/* oxlint-disable-next-line nextjs/no-img-element -- inline SVG data URI, nothing to optimize */}
      <img
        src={enrollment.qrDataUri}
        alt="Código QR para agregar Mis Carguitas a tu app autenticadora"
        width={200}
        height={200}
        className="mx-auto rounded-[var(--radius)] bg-label p-3"
      />
      <details className="rounded-[var(--radius)] bg-surface-2 px-4 py-3 text-[15px]">
        <summary className="cursor-pointer text-blue">¿No puedes escanear? Escribe esta clave</summary>
        <code className="mt-2 block break-all font-mono text-label">{enrollment.secret}</code>
      </details>
      <form action={confirmAction} className="space-y-4">
        <input type="hidden" name="factorId" value={enrollment.factorId} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field
          label="Código de tu app"
          {...codeInputProps}
          error={confirmed && !confirmed.ok ? confirmed.error : undefined}
        />
        <Button type="submit" className="w-full" disabled={confirming}>
          {confirming ? "Activando…" : "Activar"}
        </Button>
      </form>
    </div>
  );
}

/** Removing an app always asks for a current code (fresh aal2). */
export function RemoveFactorForm({ factorId, name }: { factorId: string; name: string }) {
  const [state, action, pending] = useActionState(removeFactor, undefined);
  return (
    <form action={action} className="flex items-end gap-3 px-4 pb-4">
      <input type="hidden" name="factorId" value={factorId} />
      <div className="min-w-0 flex-1">
        <Field
          label={`Código para quitar «${name}»`}
          {...codeInputProps}
          error={state && !state.ok ? state.error : undefined}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={pending} className="mb-[1px] shrink-0">
        Quitar
      </Button>
    </form>
  );
}
