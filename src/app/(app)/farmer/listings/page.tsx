import { Plus, Sprout } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { formatCop, formatKg } from "@/lib/format";

const STATUS = {
  draft: { label: "Borrador", tone: "neutral" },
  published: { label: "Publicada", tone: "green" },
  sold_out: { label: "Vendida", tone: "blue" },
  expired: { label: "Vencida", tone: "neutral" },
  withdrawn: { label: "Retirada", tone: "neutral" },
} as const;

type ListingRow = {
  id: string;
  status: keyof typeof STATUS;
  available_kg: string;
  quantity_kg: string;
  price_cop_per_kg: number;
  products: { name_es: string } | null;
};

export default async function FarmerListings() {
  const viewer = await requireRole("farmer");
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, status, available_kg, quantity_kg, price_cop_per_kg, products(name_es)")
    .eq("farmer_id", viewer.id)
    .order("created_at", { ascending: false })
    .returns<ListingRow[]>();

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
      {!data?.length ? (
        <EmptyState
          icon={<Sprout />}
          title="Aún no tienes carguitas"
          body="Publica lo que vas a cosechar: producto, cuántos kilos y a qué precio. Los compradores de la ciudad te escriben."
          action={<LinkButton href="/farmer/listings/new">Publicar la primera</LinkButton>}
        />
      ) : (
        <Group>
          {data.map((l) => (
            <Row
              key={l.id}
              title={l.products?.name_es ?? "Producto"}
              subtitle={`${formatKg(l.available_kg)} de ${formatKg(l.quantity_kg)} · ${formatCop(l.price_cop_per_kg)}/kg`}
              trailing={<StatusPill tone={STATUS[l.status].tone}>{STATUS[l.status].label}</StatusPill>}
            />
          ))}
        </Group>
      )}
    </>
  );
}
