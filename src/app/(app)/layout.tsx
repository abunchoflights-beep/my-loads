import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole } from "@/lib/auth/viewer";

// Second gate after src/proxy.ts. Each page below also calls requireRole()
// with its own roles, so a misconfigured matcher can't expose a screen.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await requireRole();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
