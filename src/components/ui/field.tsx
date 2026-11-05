import type { ComponentProps, ReactNode } from "react";

/** Shared look for inputs, selects and file pickers (DESIGN.md › Field). */
const control =
  "h-12 w-full rounded-[var(--radius-sm)] bg-surface-2 px-4 text-[17px] text-label placeholder:text-label-3 " +
  "outline-none focus:ring-2 focus:ring-blue aria-[invalid]:ring-2 aria-[invalid]:ring-red";

function Message({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <span className="mt-1.5 block text-[13px] text-red">{error}</span>;
  if (hint) return <span className="mt-1.5 block text-[13px] text-label-2">{hint}</span>;
  return null;
}

/** Text input with its label above and a hint or error below. */
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
      <input id={id} aria-invalid={error ? true : undefined} className={control} {...props} />
      <Message error={error} hint={hint} />
    </label>
  );
}

/** Native select styled like Field. Native keeps it light and accessible on low-end Android. */
export function SelectField({
  label,
  hint,
  error,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hint?: string; error?: string; children: ReactNode }) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] text-label-2">{label}</span>
      <select id={id} aria-invalid={error ? true : undefined} className={control} {...props}>
        {children}
      </select>
      <Message error={error} hint={hint} />
    </label>
  );
}

/**
 * File picker styled like Field. `onFile` shows what is already on file, so a
 * user fixing one field doesn't have to upload everything again.
 */
export function FileField({
  label,
  hint,
  error,
  onFile,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
  hint?: string;
  error?: string;
  onFile?: string;
}) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] text-label-2">{label}</span>
      {onFile && <span className="mb-1.5 block text-[15px] text-green">{onFile}</span>}
      <input
        id={id}
        type="file"
        aria-invalid={error ? true : undefined}
        className={
          "block w-full rounded-[var(--radius-sm)] bg-surface-2 p-2 text-[15px] text-label-2 " +
          "file:mr-3 file:h-10 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-3 file:px-4 file:text-[15px] file:text-label " +
          "outline-none focus:ring-2 focus:ring-blue aria-[invalid]:ring-2 aria-[invalid]:ring-red"
        }
        {...props}
      />
      <Message error={error} hint={hint} />
    </label>
  );
}
