import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function ListingDetail({ params }: PageProps<"/market/[id]">) {
  await requireRole("buyer", "farmer", "admin");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <>
      <PageHeader title="Detalle de la carguita" />
      <SpecPlaceholder issue="S2-04 · S3-01">Detalle, fotos, productor y formulario de pedido</SpecPlaceholder>
    </>
  );
}
