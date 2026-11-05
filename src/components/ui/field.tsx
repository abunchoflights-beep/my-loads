import type { ComponentProps } from "react";

export function Field({
  label,
  hint,
  error,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string; error?: string }) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] text-label-2">{label}</span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className="h-12 w-full rounded-[var(--radius-sm)] bg-surface-2 px-4 text-[17px] text-label placeholder:text-label-3 outline-none focus:ring-2 focus:ring-blue aria-[invalid]:ring-2 aria-[invalid]:ring-red"
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-[13px] text-red">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13px] text-label-3">{hint}</span>
      ) : null}
    </label>
  );
}
