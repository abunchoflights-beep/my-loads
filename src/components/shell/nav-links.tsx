"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  House,
  MapPin,
  ReceiptText,
  Route,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import type { NavItem } from "./nav";

const ICONS = {
  home: House,
  sprout: Sprout,
  receipt: ReceiptText,
  store: Store,
  truck: Truck,
  route: Route,
  map: MapPin,
  user: UserRound,
  shield: ShieldCheck,
  check: BadgeCheck,
} as const;

function isActive(pathname: string, href: string, items: NavItem[]) {
  if (pathname === href) return true;
  if (!pathname.startsWith(href + "/")) return false;
  // "/farmer" must not light up when "/farmer/listings" has its own tab.
  return !items.some((i) => i.href !== href && i.href.startsWith(href) && pathname.startsWith(i.href));
}

export function SidebarLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href, items);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[15px] ${
                active ? "bg-surface-2 text-label" : "text-label-2 hover:bg-surface-1 hover:text-label"
              }`}
            >
              <Icon aria-hidden className="size-[18px]" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function TabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-bg/80 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href, items);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 pt-2 text-[10px] font-medium ${active ? "text-label" : "text-label-3"}`}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
