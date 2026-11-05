import { Store } from "lucide-react";
import { EmptyState, SpecPlaceholder } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { formatCop, formatDay, formatKg } from "@/lib/format";
import { municipalityName } from "@/lib/format/municipalities";

type MarketRow = {
  id: string;
  available_kg: string;
  price_cop_per_kg: number;
  quality_grade: string;
  municipality_code: string;
  available_until: string;
  products: { name_es: string } | null;
};

export default async function Market() {
  await requireRole("buyer", "farmer", "admin");
  const supabase = await createClient();
  // RLS returns only published, in-window lots (plus the viewer's own).
  const { data } = await supabase
    .from("listings")
    .select(
      "id, available_kg, price_cop_per_kg, quality_grade, municipality_code, available_until, products(name_es)",
    )
    .eq("status", "published")
    .gte("available_until", new Date().toISOString().slice(0, 10))
    .order("published_at", { ascending: false })
    .limit(50)
    .returns<MarketRow[]>();

  return (
    <>
      <PageHeader title="Mercado" subtitle="Cosecha disponible, directo de la finca." />
      <div className="mb-6">
        <SpecPlaceholder issue="S2-03">Filtros por producto, municipio, calidad y precio</SpecPlaceholder>
      </div>
      {!data?.length ? (
        <EmptyState
          icon={<Store />}
          title="No hay cosecha publicada"
          body="Vuelve más tarde o activa alertas por producto (S2-05)."
        />
      ) : (
        <Group>
          {data.map((l) => (
            <Row
              key={l.id}
              href={`/market/${l.id}`}
              title={`${l.products?.name_es ?? "Producto"} · ${l.quality_grade}`}
              subtitle={`${municipalityName(l.municipality_code)} · ${formatKg(l.available_kg)} · hasta ${formatDay(l.available_until)}`}
              trailing={<span className="text-label">{formatCop(l.price_cop_per_kg)}/kg</span>}
            />
          ))}
        </Group>
      )}
    </>
  );
}
