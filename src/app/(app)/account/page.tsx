import { BadgeCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/lib/auth/viewer";

const VERIFICATION = {
  unverified: { label: "Sin verificar", tone: "orange" },
  pending: { label: "En revisión", tone: "blue" },
  verified: { label: "Verificada", tone: "green" },
  rejected: { label: "Rechazada", tone: "red" },
  suspended: { label: "Suspendida", tone: "red" },
} as const;

export default async function Account() {
  const viewer = await requireRole();
  const v = VERIFICATION[viewer.verification];
  return (
    <>
      <PageHeader title="Cuenta" subtitle={viewer.email ?? undefined} />
      <Group>
        <Row
          icon={<BadgeCheck className="size-4" />}
          title="Verificación"
          trailing={<StatusPill tone={v.tone}>{v.label}</StatusPill>}
          href="/account/verification"
        />
        <Row
          icon={<KeyRound className="size-4" />}
          title="Seguridad"
          subtitle="Contraseña y verificación en dos pasos"
          href="/account/security"
        />
      </Group>
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="destructive" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}
