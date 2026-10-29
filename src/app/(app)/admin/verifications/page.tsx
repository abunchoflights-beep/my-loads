import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function AdminVerifications() {
  await requireRole("admin");
  return (
    <>
      <PageHeader title="Verificaciones" subtitle="Personas y vehículos esperando revisión." />
      <SpecPlaceholder issue="S1-03">Cola de verificación (requiere aal2)</SpecPlaceholder>
    </>
  );
}
