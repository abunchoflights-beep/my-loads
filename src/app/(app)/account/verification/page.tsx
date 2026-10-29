import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Verification() {
  await requireRole();
  return (
    <>
      <PageHeader title="Verificación" subtitle="Nombre legal, documento, celular y soporte (RUT o cédula)." />
      <SpecPlaceholder issue="S1-02">Formulario de verificación + carga al bucket kyc</SpecPlaceholder>
    </>
  );
}
