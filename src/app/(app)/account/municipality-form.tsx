"use client";

/** "Tu municipio" on /account (S1-06): the picker plus a save button. */
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { MunicipalityPicker, type MunicipalityOption } from "@/components/ui/municipality-picker";
import { updateMunicipality } from "./actions";

export function MunicipalityForm({ current }: { current: MunicipalityOption | null }) {
  const [state, action, pending] = useActionState(updateMunicipality, undefined);
  return (
    <form action={action} className="space-y-4 p-4">
      <MunicipalityPicker
        name="municipalityCode"
        label="Tu municipio"
        defaultValue={current}
        hint="Los compradores y transportadores ven solo el municipio, nunca tu dirección."
        error={state && !state.ok ? state.error : undefined}
      />
      {state?.ok && <p className="text-[15px] text-green">Guardado.</p>}
      <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
        {pending ? "Guardando…" : "Guardar municipio"}
      </Button>
    </form>
  );
}
