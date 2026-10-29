import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4 pt-2">
      <div>
        <h1 className="large-title">{title}</h1>
        {subtitle && <p className="mt-1 text-[17px] text-label-2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
