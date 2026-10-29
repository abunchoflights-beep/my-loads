import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { SpecPlaceholder } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/viewer";

export default async function LoadDetail({ params }: PageProps<"/loads/[id]">) {
  await requireRole("carrier");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <>
      <PageHeader title="Detalle del flete" />
      <SpecPlaceholder issue="S4-02">Detalle y formulario de oferta</SpecPlaceholder>
    </>
  );
}
