import { Store } from "lucide-react";
import { EmptyState, SpecPlaceholder } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { listMarketListings } from "@/lib/data/listings";
import { formatCop, formatDay, formatKg } from "@/lib/format";

export default async function Market() {
  await requireRole("buyer", "farmer", "admin");
  // RLS returns only published, in-window lots (plus the viewer's own).
  const listings = await listMarketListings();

  return (
    <>
      <PageHeader title="Mercado" subtitle="Cosecha disponible, directo de la finca." />
      <div className="mb-6">
        <SpecPlaceholder issue="S2-03">Filtros por producto, municipio, calidad y precio</SpecPlaceholder>
      </div>
      {listings.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title="No hay cosecha publicada"
          body="Vuelve más tarde o activa alertas por producto (S2-05)."
        />
      ) : (
        <Group>
          {listings.map((l) => (
            <Row
              key={l.id}
              href={`/market/${l.id}`}
              title={`${l.productName} · ${l.grade}`}
              subtitle={`${l.municipality} · ${formatKg(l.availableKg)} · hasta ${formatDay(l.availableUntil)}`}
              trailing={<span className="text-label">{formatCop(l.pricePerKg)}/kg</span>}
            />
          ))}
        </Group>
      )}
    </>
  );
}
