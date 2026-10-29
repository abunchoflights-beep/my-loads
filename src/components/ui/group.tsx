import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

// iOS "inset grouped" list: a titled block of rows on surface-1.
export function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {title && <h2 className="px-4 pb-2 text-[13px] uppercase tracking-wide text-label-2">{title}</h2>}
      <div className="overflow-hidden rounded-[var(--radius)] bg-surface-1 divide-y divide-separator">{children}</div>
      {footer && <p className="px-4 pt-2 text-[13px] text-label-2">{footer}</p>}
    </section>
  );
}

export function Row({
  title,
  subtitle,
  trailing,
  href,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  icon?: ReactNode;
}) {
  const body = (
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      {icon && <span className="grid size-8 place-items-center rounded-[8px] bg-surface-2 text-label">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px]">{title}</div>
        {subtitle && <div className="truncate text-[15px] text-label-2">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-[15px] text-label-2">{trailing}</div>}
      {href && <ChevronRight aria-hidden className="size-4 shrink-0 text-label-3" />}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:bg-surface-2 active:bg-surface-3">
      {body}
    </Link>
  ) : (
    body
  );
}
