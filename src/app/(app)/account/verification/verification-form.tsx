"use client";

/** The editable verification form (S1-02): PII plus supporting files. */
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FileField, SelectField } from "@/components/ui/field";
import type { AppRole } from "@/lib/auth/access";
import { submitVerificationForm } from "./actions";

const DOCUMENT_TYPE_LABELS = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  NIT: "NIT (empresa)",
  PPT: "Permiso por protección temporal (PPT)",
  PASSPORT: "Pasaporte",
} as const;

const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

/** Tells the user a file is already on record, so they needn't upload it again. */
function onFile(has: boolean): string | undefined {
  return has ? "Ya tenemos un archivo. Sube otro solo si quieres cambiarlo." : undefined;
}

type Initial = {
  readonly legalName: string;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly phone: string;
  readonly files: Readonly<Record<"document" | "license" | "rut", boolean>>;
};

/** Form state lives in the Server Action; this only renders it. */
export function VerificationForm({ role, initial }: { role: AppRole; initial: Initial }) {
  const [state, action, pending] = useActionState(submitVerificationForm, undefined);
  const failed = state && !state.ok ? state : null;
  // After a failed submit React resets the form; show what was typed again.
  const value = (key: keyof Omit<Initial, "files">): string => failed?.values?.[key] ?? initial[key];
  const error = (key: string): string | undefined => failed?.fields?.[key];

  if (state?.ok) {
    return (
      <p className="rounded-[var(--radius)] bg-green/15 px-4 py-3 text-[15px] text-green">
        Enviado. Revisamos tus datos en menos de 1 día hábil y te avisamos.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {failed && (
        <p role="alert" className="text-[15px] text-red">
          {failed.error}
        </p>
      )}
      <Field
        label="Nombre completo, como aparece en el documento"
        name="legalName"
        autoComplete="name"
        defaultValue={value("legalName")}
        error={error("legalName")}
        required
      />
      <SelectField
        label="Tipo de documento"
        name="documentType"
        defaultValue={value("documentType")}
        error={error("documentType")}
        required
      >
        <option value="" disabled>
          Elige uno
        </option>
        {Object.entries(DOCUMENT_TYPE_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </SelectField>
      <Field
        label="Número del documento"
        name="documentNumber"
        defaultValue={value("documentNumber")}
        hint="Puedes escribirlo con o sin puntos."
        error={error("documentNumber")}
        required
      />
      <Field
        label="Celular"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="300 123 4567"
        defaultValue={value("phone")}
        hint="Solo lo verán las personas con las que cierres un negocio."
        error={error("phone")}
        required
      />
      <FileField
        label="Foto o PDF de tu documento (ambos lados)"
        name="documentFile"
        accept={ACCEPT}
        onFile={onFile(initial.files.document)}
        hint="PDF, JPG o PNG de hasta 10 MB. Le quitamos la ubicación a las fotos."
        error={error("documentFile")}
      />
      {role === "carrier" && (
        <FileField
          label="Foto o PDF de tu licencia de conducción"
          name="licenseFile"
          accept={ACCEPT}
          onFile={onFile(initial.files.license)}
          error={error("licenseFile")}
        />
      )}
      {role === "farmer" && (
        <FileField
          label="RUT (opcional)"
          name="rutFile"
          accept={ACCEPT}
          onFile={onFile(initial.files.rut)}
          hint="Ayuda si vas a facturar. Puedes enviarlo después."
          error={error("rutFile")}
        />
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar para revisión"}
      </Button>
    </form>
  );
}
