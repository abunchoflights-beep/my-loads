import { Plus, ReceiptText, Sprout, Tractor } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Group, Row } from "@/components/ui/group";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export default async function FarmerHome() {
  await requireRole("farmer");
  const supabase = await createClient();

  // RLS scopes both counts to this farmer.
  const [pending, published] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "published"),
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
        <Row icon={<ReceiptText className="size-4" />} title="Pedidos por responder" trailing={pending.count ?? 0} href="/farmer/orders" />
        <Row icon={<Sprout className="size-4" />} title="Carguitas publicadas" trailing={published.count ?? 0} href="/farmer/listings" />
        <Row icon={<Tractor className="size-4" />} title="Mis fincas" href="/farmer/farms" />
      </Group>
    </>
  );
}
