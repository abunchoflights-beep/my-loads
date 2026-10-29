import type { Metadata } from "next";
import { SpecPlaceholder } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Política de tratamiento de datos" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="large-title mb-6">Tratamiento de datos personales</h1>
      <p className="mb-6 text-[17px] text-label-2">
        Política conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013. El texto final lo redacta y aprueba el
        área legal antes del lanzamiento.
      </p>
      <SpecPlaceholder issue="S0-07">Texto legal pendiente</SpecPlaceholder>
    </main>
  );
}
