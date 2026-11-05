import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/lib/auth/viewer";
import { canEditVerification, getMyVerification } from "@/lib/data/verification";
import { formatDay, maskTail } from "@/lib/format";
import { VerificationForm } from "./verification-form";

const STATUS = {
  unverified: { label: "Sin verificar", tone: "orange" },
  pending: { label: "En revisión", tone: "blue" },
  verified: { label: "Verificada", tone: "green" },
  rejected: { label: "Rechazada", tone: "red" },
  suspended: { label: "Suspendida", tone: "red" },
} as const;

/**
 * /account/verification (S1-02). Editable while unverified or rejected (the
 * rejected state shows the reviewer's note); read-only and partly masked once
 * submitted.
 */
export default async function Verification() {
  const viewer = await requireRole();
  const v = await getMyVerification(viewer.id);
  const status = STATUS[v.status];

  if (!canEditVerification(v.status)) {
    return (
      <>
        <PageHeader title="Verificación" subtitle="Estos datos ya no se pueden cambiar desde la app." />
        <Group
          title="Tus datos"
          footer={
            v.status === "pending"
              ? "Revisamos en menos de 1 día hábil. Si algo no cuadra, te escribimos."
              : "Para cambiar algo, escríbenos a soporte."
          }
        >
          <Row title="Estado" trailing={<StatusPill tone={status.tone}>{status.label}</StatusPill>} />
          <Row title="Nombre" trailing={v.legalName ?? "—"} />
          <Row title="Documento" trailing={`${v.documentType ?? ""} ${maskTail(v.documentNumber)}`} />
          <Row title="Celular" trailing={maskTail(v.phone)} />
          {v.submittedAt && <Row title="Enviado" trailing={formatDay(v.submittedAt)} />}
        </Group>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Verificación"
        subtitle="Necesitamos saber quién eres antes de que vendas, compres o transportes."
      />
      {v.status === "rejected" && (
        <div className="mb-6 rounded-[var(--radius)] bg-red/15 px-4 py-3 text-[15px] text-red">
          <p className="font-semibold">Necesitamos que corrijas algo</p>
          <p className="mt-1">{v.reviewNote ?? "Revisa tus datos y vuelve a enviarlos."}</p>
        </div>
      )}
      <div className="rounded-[var(--radius-lg)] bg-surface-1 p-5">
        <VerificationForm
          role={viewer.role}
          initial={{
            legalName: v.legalName ?? "",
            documentType: v.documentType ?? "",
            documentNumber: v.documentNumber ?? "",
            phone: v.phone ?? "",
            files: v.files,
          }}
        />
      </div>
    </>
  );
}
