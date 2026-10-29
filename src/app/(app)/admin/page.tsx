import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Admin() {
  await requireRole("admin");
  return (
    <>
      <PageHeader title="Panel" subtitle="Operación del marketplace." />
      <SpecPlaceholder issue="S7-03">KPIs, disputas y auditoría</SpecPlaceholder>
    </>
  );
}
