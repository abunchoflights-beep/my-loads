import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function FarmerOrders() {
  await requireRole("farmer");
  return (
    <>
      <PageHeader title="Pedidos" subtitle="Acepta o rechaza en menos de 24 horas." />
      <SpecPlaceholder issue="S3-02">Bandeja de pedidos del productor</SpecPlaceholder>
    </>
  );
}
