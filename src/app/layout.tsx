import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mis Carguitas", template: "%s · Mis Carguitas" },
  description:
    "Vende tu cosecha directo a los mercados de las ciudades y consigue el camión en el mismo lugar. Sin intermediarios.",
  applicationName: "Mis Carguitas",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce CSP: every page must render per request so Next can stamp the
  // nonce from src/proxy.ts onto its scripts.
  await connection();

  return (
    <html lang="es-CO" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
