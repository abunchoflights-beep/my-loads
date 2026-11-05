import { Truck } from "lucide-react";
import { EmptyState, SpecPlaceholder } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { formatCop, formatDay, formatKg } from "@/lib/format";
import { municipalityName } from "@/lib/format/municipalities";

type LoadRow = {
  id: string;
  weight_kg: string;
  required_body: string | null;
  origin_municipality_code: string;
  destination_municipality_code: string;
  pickup_on: string;
  target_rate_cop: number | null;
  products: { name_es: string } | null;
};

export default async function LoadBoard() {
  const viewer = await requireRole("carrier");
  const supabase = await createClient();
  // RLS shows posted loads only to verified carriers.
  const { data } = await supabase
    .from("loads")
    .select(
      "id, weight_kg, required_body, origin_municipality_code, destination_municipality_code, pickup_on, target_rate_cop, products(name_es)",
    )
    .eq("status", "posted")
    .order("pickup_on")
    .limit(50)
    .returns<LoadRow[]>();

  return (
    <>
      <PageHeader title="Fletes" subtitle="Cargas de finca a ciudad, listas para recoger." />
      <div className="mb-6">
        <SpecPlaceholder issue="S4-01">Filtros por ruta, fecha, carrocería y peso</SpecPlaceholder>
      </div>
      {viewer.verification !== "verified" ? (
        <EmptyState
          icon={<Truck />}
          title="Verifica tu cuenta y tu vehículo"
          body="Los fletes se muestran solo a transportadores verificados."
        />
      ) : !data?.length ? (
        <EmptyState
          icon={<Truck />}
          title="No hay fletes publicados ahora"
          body="Te avisamos cuando salga uno en tu ruta (S4-05)."
        />
      ) : (
        <Group>
          {data.map((l) => (
            <Row
              key={l.id}
              href={`/loads/${l.id}`}
              title={`${municipalityName(l.origin_municipality_code)} → ${municipalityName(l.destination_municipality_code)}`}
              subtitle={`${l.products?.name_es ?? ""} · ${formatKg(l.weight_kg)} · ${l.required_body ?? "cualquier carrocería"} · recoge ${formatDay(l.pickup_on)}`}
              trailing={l.target_rate_cop ? formatCop(l.target_rate_cop) : "Oferta"}
            />
          ))}
        </Group>
      )}
    </>
  );
}
