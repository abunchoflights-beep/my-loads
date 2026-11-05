import Link from "next/link";
import { Sprout, Store, Truck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

const SIDES = [
  {
    icon: Sprout,
    title: "Si produces",
    body: "Publica tu cosecha con tu precio. Te compra directo el mercado de la ciudad, sin intermediario que se quede con la mitad.",
    cta: "Vender mi cosecha",
    role: "farmer",
  },
  {
    icon: Store,
    title: "Si compras",
    body: "Plátano de Urabá, aguacate de Caldas, café del Huila. Compras en finca, con trazabilidad y el flete resuelto.",
    cta: "Comprar en finca",
    role: "buyer",
  },
  {
    icon: Truck,
    title: "Si transportas",
    body: "Fletes de finca a ciudad publicados todos los días. Ofertas tu precio, cargas y te pagan al entregar.",
    cta: "Ver fletes",
    role: "carrier",
  },
] as const;

export default function Landing() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
      <header className="flex h-16 items-center justify-between">
        <span className="text-[20px] font-bold tracking-tight">Mis Carguitas</span>
        <Link href="/login" className="text-[15px] text-label-2 hover:text-label">
          Ingresar
        </Link>
      </header>

      <section className="py-20 md:py-32">
        <h1 className="max-w-3xl text-[44px] font-bold leading-[1.05] tracking-tight md:text-[72px]">
          De la finca al mercado.
          <span className="block text-label-2">Sin intermediarios.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[19px] text-label-2 md:text-[21px]">
          Vende tu carga directo a las plazas y negocios de las ciudades, y consigue el camión en el mismo
          lugar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href="/signup?role=farmer">Empezar a vender</LinkButton>
          <LinkButton href="/signup?role=buyer" variant="secondary">
            Quiero comprar
          </LinkButton>
        </div>
      </section>

      <section className="grid gap-4 pb-24 md:grid-cols-3">
        {SIDES.map(({ icon: Icon, title, body, cta, role }) => (
          <article key={role} className="flex flex-col rounded-[var(--radius-lg)] bg-surface-1 p-6">
            <Icon aria-hidden className="mb-6 size-8" />
            <h2 className="text-[22px] font-semibold">{title}</h2>
            <p className="mt-2 flex-1 text-[15px] text-label-2">{body}</p>
            <Link href={`/signup?role=${role}`} className="mt-6 text-[15px] text-blue">
              {cta} →
            </Link>
          </article>
        ))}
      </section>

      <footer className="flex flex-wrap gap-6 border-t border-separator py-8 text-[13px] text-label-3">
        <span>Hecho en Colombia</span>
        <Link href="/legal/privacy">Tratamiento de datos</Link>
        <Link href="/legal/terms">Términos</Link>
      </footer>
    </div>
  );
}
