import Link from "next/link";
import type { ReactNode } from "react";
import type { SignedInViewer } from "@/lib/auth/viewer";
import { NAV } from "./nav";
import { SidebarLinks, TabBar } from "./nav-links";
import { VerificationBanner } from "./verification-banner";

const ROLE_LABEL = { farmer: "Productor", buyer: "Comprador", carrier: "Transportador", admin: "Admin" } as const;

export function AppShell({ viewer, children }: { viewer: SignedInViewer; children: ReactNode }) {
  const items = NAV[viewer.role];
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-separator px-3 py-6 md:flex">
        <Link href="/" className="mb-8 px-3 text-[20px] font-bold tracking-tight">
          Mis Carguitas
        </Link>
        <SidebarLinks items={items} />
        <div className="mt-auto px-3 text-[13px] text-label-3">
          {ROLE_LABEL[viewer.role]}
          {viewer.email ? ` · ${viewer.email}` : ""}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
          <VerificationBanner status={viewer.verification} role={viewer.role} />
          {children}
        </main>
      </div>
      <TabBar items={items} />
    </div>
  );
}
