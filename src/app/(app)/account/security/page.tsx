import { ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { listTotpFactors } from "@/lib/auth/mfa";
import { requireRole } from "@/lib/auth/viewer";
import { formatDay } from "@/lib/format";
import { signOutEverywhereAction } from "./actions";
import { ChallengeForm, EnrollFlow, RemoveFactorForm } from "./mfa-forms";

/**
 * /account/security (S1-05). With a verified factor and an aal1 session it is
 * the code challenge; otherwise it manages authenticator apps and sessions.
 */
export default async function Security({ searchParams }: PageProps<"/account/security">) {
  const viewer = await requireRole();
  const params = await searchParams;
  // Passed through to the actions, which validate it with safeNextPath().
  const next = typeof params.next === "string" ? params.next : undefined;

  if (viewer.mfaEnrolled && viewer.aal !== "aal2") {
    return (
      <>
        <PageHeader
          title="Verificación en dos pasos"
          subtitle="Escribe el código que muestra tu app autenticadora."
        />
        <div className="rounded-[var(--radius-lg)] bg-surface-1 p-5">
          <ChallengeForm next={next} />
        </div>
        <form action="/auth/signout" method="post" className="mt-6">
          <Button type="submit" variant="plain" className="w-full">
            Entrar con otra cuenta
          </Button>
        </form>
      </>
    );
  }

  const factors = await listTotpFactors();
  const adminNeedsMfa = viewer.role === "admin" && viewer.aal !== "aal2";

  return (
    <>
      <PageHeader title="Seguridad" subtitle="Protege tu cuenta con una app autenticadora en tu celular." />

      {adminNeedsMfa && (
        <p className="mb-6 rounded-[var(--radius)] bg-orange/15 px-4 py-3 text-[15px] text-orange">
          Para entrar al panel de administración necesitas la verificación en dos pasos.
        </p>
      )}

      <Group
        title="Apps autenticadoras"
        footer={
          factors.length === 1
            ? "Recomendado: agrega un segundo celular de respaldo. Si pierdes el único, tendrás que escribirnos para recuperar tu cuenta."
            : undefined
        }
      >
        {factors.length === 0 ? (
          <Row
            icon={<ShieldCheck aria-hidden className="size-4" />}
            title="Verificación en dos pasos desactivada"
            subtitle="Con ella, aunque alguien sepa tu contraseña no podrá entrar."
            trailing={<StatusPill tone="orange">Inactiva</StatusPill>}
          />
        ) : (
          factors.map((factor) => (
            <div key={factor.id}>
              <Row
                icon={<Smartphone aria-hidden className="size-4" />}
                title={factor.name}
                subtitle={`Agregada el ${formatDay(factor.createdAt)}`}
                trailing={<StatusPill tone="green">Activa</StatusPill>}
              />
              <RemoveFactorForm factorId={factor.id} name={factor.name} />
            </div>
          ))
        )}
      </Group>

      <div className="mb-8 rounded-[var(--radius-lg)] bg-surface-1 p-5">
        <EnrollFlow next={next} hasFactors={factors.length > 0} />
      </div>

      <Group title="Sesiones" footer="Cierra la sesión en todos los celulares y computadores donde entraste.">
        <form action={signOutEverywhereAction} className="p-4">
          <Button type="submit" variant="destructive" className="w-full">
            Cerrar sesión en todos los dispositivos
          </Button>
        </form>
      </Group>
    </>
  );
}
