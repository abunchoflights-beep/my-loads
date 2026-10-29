import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10">
      <Link href="/" className="mb-10 text-[22px] font-bold tracking-tight">
        Mis Carguitas
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
