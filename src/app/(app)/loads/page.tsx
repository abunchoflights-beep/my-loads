import { Truck } from "lucide-react";
import { EmptyState, SpecPlaceholder } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { listPostedLoads } from "@/lib/data/loads";
import { formatCop, formatDay, formatKg } from "@/lib/format";

export default async function LoadBoard() {
  const viewer = await requireRole("carrier");
  const verified = viewer.verification === "verified";
  // RLS shows posted loads only to verified carriers; skip the query otherwise.
  const loads = verified ? await listPostedLoads() : [];

  return (
    <>
      <PageHeader title="Fletes" subtitle="Cargas de finca a ciudad, listas para recoger." />
      <div className="mb-6">
        <SpecPlaceholder issue="S4-01">Filtros por ruta, fecha, carrocería y peso</SpecPlaceholder>
      </div>
      {!verified ? (
        <EmptyState
          icon={<Truck />}
          title="Verifica tu cuenta y tu vehículo"
          body="Los fletes se muestran solo a transportadores verificados."
        />
      ) : loads.length === 0 ? (
        <EmptyState
          icon={<Truck />}
          title="No hay fletes publicados ahora"
          body="Te avisamos cuando salga uno en tu ruta (S4-05)."
        />
      ) : (
        <Group>
          {loads.map((l) => (
            <Row
              key={l.id}
              href={`/loads/${l.id}`}
              title={`${l.origin} → ${l.destination}`}
              subtitle={`${l.productName} · ${formatKg(l.weightKg)} · ${l.requiredBody ?? "cualquier carrocería"} · recoge ${formatDay(l.pickupOn)}`}
              trailing={l.targetRateCop ? formatCop(l.targetRateCop) : "Oferta"}
            />
          ))}
        </Group>
      )}
    </>
  );
}
