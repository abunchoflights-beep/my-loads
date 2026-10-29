import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Trips() {
  await requireRole("carrier");
  return (
    <>
      <PageHeader title="Mis viajes" subtitle="Recogidas, entregas y códigos." />
      <SpecPlaceholder issue="S5-01 · S5-02">Viaje activo: paradas, códigos y ubicación</SpecPlaceholder>
    </>
  );
}
