import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function Security() {
  await requireRole();
  return (
    <>
      <PageHeader title="Seguridad" subtitle="Verificación en dos pasos con app autenticadora." />
      <SpecPlaceholder issue="S1-05">
        Enrolar TOTP, desafío aal2, cerrar sesión en todos los dispositivos
      </SpecPlaceholder>
    </>
  );
}
