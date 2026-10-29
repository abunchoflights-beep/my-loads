import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Farms() {
  await requireRole("farmer");
  return (
    <>
      <PageHeader title="Mis fincas" subtitle="La ubicación exacta solo la ve el transportador que contrates." />
      <SpecPlaceholder issue="S1-04">Registro de fincas</SpecPlaceholder>
    </>
  );
}
