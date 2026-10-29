import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function NewListing() {
  await requireRole("farmer");
  return (
    <>
      <PageHeader title="Nueva carguita" subtitle="Producto, kilos, precio y fechas." />
      <SpecPlaceholder issue="S2-02">Formulario de publicación</SpecPlaceholder>
    </>
  );
}
