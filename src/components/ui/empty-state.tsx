import type { ReactNode } from "react";

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-lg)] bg-surface-1 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-label-3 [&_svg]:size-10">{icon}</div>}
      <h2 className="text-[20px] font-semibold">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-[15px] text-label-2">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Marks a screen whose behavior is specified but not built yet.
export function SpecPlaceholder({ issue, children }: { issue: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-separator px-4 py-3 text-[13px] text-label-2">
      <span className="font-mono text-label">{issue}</span> · {children} (docs/specs/)
    </div>
  );
}
