import type { Metadata } from "next";
import { SpecPlaceholder } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="large-title mb-6">Términos y condiciones</h1>
      <SpecPlaceholder issue="S0-07">Texto legal pendiente</SpecPlaceholder>
    </main>
  );
}
