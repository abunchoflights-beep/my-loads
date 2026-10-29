import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function BuyerLocations() {
  await requireRole("buyer");
  return (
    <>
      <PageHeader title="Puntos de entrega" subtitle="Bodega, local o puesto en plaza." />
      <SpecPlaceholder issue="S1-04">Registro de puntos de entrega</SpecPlaceholder>
    </>
  );
}
