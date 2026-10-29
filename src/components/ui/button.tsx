import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "plain" | "destructive";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] px-5 h-12 text-[17px] font-semibold " +
  "transition-[opacity,background-color] active:opacity-70 disabled:opacity-40 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-surface-2 text-label hover:bg-surface-3",
  plain: "text-blue px-0 h-auto font-normal",
  destructive: "bg-surface-2 text-red hover:bg-surface-3",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
