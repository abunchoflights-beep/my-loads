import Link from "next/link";
import type { SignedInViewer } from "@/lib/auth/viewer";

const COPY: Partial<Record<SignedInViewer["verification"], { text: string; tone: string }>> = {
  unverified: { text: "Verifica tu identidad para publicar, comprar o transportar.", tone: "text-orange" },
  pending: { text: "Estamos revisando tus documentos. Te avisamos apenas quede.", tone: "text-label-2" },
  rejected: { text: "No pudimos verificar tus datos. Revisa la nota y vuelve a enviar.", tone: "text-red" },
  suspended: { text: "Tu cuenta está suspendida. Escríbenos para revisarlo.", tone: "text-red" },
};

export function VerificationBanner({
  status,
  role,
}: {
  status: SignedInViewer["verification"];
  role: SignedInViewer["role"];
}) {
  const copy = COPY[status];
  if (!copy || role === "admin") return null;
  return (
    <Link
      href="/account/verification"
      className="mb-6 block rounded-[var(--radius)] bg-surface-1 px-4 py-3 text-[15px] hover:bg-surface-2"
    >
      <span className={copy.tone}>{copy.text}</span> <span className="text-blue">Ver</span>
    </Link>
  );
}
