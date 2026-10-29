import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function BuyerOrders() {
  await requireRole("buyer");
  return (
    <>
      <PageHeader title="Pedidos" subtitle="Tus compras, ofertas de flete y entregas." />
      <SpecPlaceholder issue="S3-03 · S4-03">Pedidos del comprador y ofertas de transportadores</SpecPlaceholder>
    </>
  );
}
