import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Vehicles() {
  await requireRole("carrier");
  return (
    <>
      <PageHeader title="Vehículos" subtitle="Placa, carrocería, capacidad, SOAT y tecnomecánica." />
      <SpecPlaceholder issue="S1-04">Registro de vehículos</SpecPlaceholder>
    </>
  );
}
