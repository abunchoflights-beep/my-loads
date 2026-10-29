import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-[13px] uppercase tracking-wide text-label-3">404</p>
      <h1 className="mt-2 text-[28px] font-bold">Esta página no existe</h1>
      <LinkButton href="/" variant="secondary" className="mt-8">
        Volver al inicio
      </LinkButton>
    </main>
  );
}
