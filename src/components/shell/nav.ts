import type { AppRole } from "@/lib/auth/access";

// Max 4 tabs on mobile (Apple HIG: 3–5). Account is always last.
export type NavItem = { href: string; label: string; icon: "home" | "sprout" | "receipt" | "store" | "truck" | "route" | "map" | "user" | "shield" | "check" };

export const NAV: Record<AppRole, NavItem[]> = {
  farmer: [
    { href: "/farmer", label: "Inicio", icon: "home" },
    { href: "/farmer/listings", label: "Mis carguitas", icon: "sprout" },
    { href: "/farmer/orders", label: "Pedidos", icon: "receipt" },
    { href: "/account", label: "Cuenta", icon: "user" },
  ],
  buyer: [
    { href: "/market", label: "Mercado", icon: "store" },
    { href: "/buyer/orders", label: "Pedidos", icon: "receipt" },
    { href: "/buyer/locations", label: "Entregas", icon: "map" },
    { href: "/account", label: "Cuenta", icon: "user" },
  ],
  carrier: [
    { href: "/loads", label: "Fletes", icon: "truck" },
    { href: "/trips", label: "Mis viajes", icon: "route" },
    { href: "/vehicles", label: "Vehículos", icon: "truck" },
    { href: "/account", label: "Cuenta", icon: "user" },
  ],
  admin: [
    { href: "/admin", label: "Panel", icon: "shield" },
    { href: "/admin/verifications", label: "Verificar", icon: "check" },
    { href: "/market", label: "Mercado", icon: "store" },
    { href: "/account", label: "Cuenta", icon: "user" },
  ],
};
