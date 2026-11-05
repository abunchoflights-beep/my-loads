import { Plus, ReceiptText, Sprout, Tractor } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { countPublishedListings } from "@/lib/data/listings";
import { countPendingOrdersForFarmer } from "@/lib/data/orders";

export default async function FarmerHome() {
  const viewer = await requireRole("farmer");
  const [pending, published] = await Promise.all([
    countPendingOrdersForFarmer(viewer.id),
    countPublishedListings(viewer.id),
  ]);

  return (
    <>
      <PageHeader
        title="Inicio"
        action={
          <LinkButton href="/farmer/listings/new" className="h-10 px-4 text-[15px]">
            <Plus aria-hidden className="size-4" /> Publicar
          </LinkButton>
        }
      />
      <Group title="Hoy">
        <Row
          icon={<ReceiptText className="size-4" />}
          title="Pedidos por responder"
          trailing={pending}
          href="/farmer/orders"
        />
        <Row
          icon={<Sprout className="size-4" />}
          title="Carguitas publicadas"
          trailing={published}
          href="/farmer/listings"
        />
        <Row icon={<Tractor className="size-4" />} title="Mis fincas" href="/farmer/farms" />
      </Group>
    </>
  );
}
