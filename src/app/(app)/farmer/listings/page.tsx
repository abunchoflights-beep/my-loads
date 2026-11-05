import { Plus, Sprout } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/lib/auth/viewer";
import { listFarmerListings } from "@/lib/data/listings";
import { formatCop, formatKg } from "@/lib/format";

const STATUS = {
  draft: { label: "Borrador", tone: "neutral" },
  published: { label: "Publicada", tone: "green" },
  sold_out: { label: "Vendida", tone: "blue" },
  expired: { label: "Vencida", tone: "neutral" },
  withdrawn: { label: "Retirada", tone: "neutral" },
} as const;

export default async function FarmerListings() {
  const viewer = await requireRole("farmer");
  const listings = await listFarmerListings(viewer.id);

  return (
    <>
      <PageHeader
        title="Mis carguitas"
        action={
          <LinkButton href="/farmer/listings/new" className="h-10 px-4 text-[15px]">
            <Plus aria-hidden className="size-4" /> Nueva
          </LinkButton>
        }
      />
      {listings.length === 0 ? (
        <EmptyState
          icon={<Sprout />}
          title="Aún no tienes carguitas"
          body="Publica lo que vas a cosechar: producto, cuántos kilos y a qué precio. Los compradores de la ciudad te escriben."
          action={<LinkButton href="/farmer/listings/new">Publicar la primera</LinkButton>}
        />
      ) : (
        <Group>
          {listings.map((l) => (
            <Row
              key={l.id}
              title={l.productName}
              subtitle={`${formatKg(l.availableKg)} de ${formatKg(l.quantityKg)} · ${formatCop(l.pricePerKg)}/kg`}
              trailing={<StatusPill tone={STATUS[l.status].tone}>{STATUS[l.status].label}</StatusPill>}
            />
          ))}
        </Group>
      )}
    </>
  );
}
