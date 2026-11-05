"use client";

/**
 * Searchable municipality field (S1-06). A native `<input list>` + `<datalist>`
 * filled from GET /api/municipalities?q= as the user types: the browser draws
 * the accessible suggestion list, so it stays light on low-end Android. The
 * chosen DANE code is submitted in a hidden input.
 */
import { useEffect, useId, useRef, useState } from "react";

/** One search result, as returned by the route handler. */
export type MunicipalityOption = { readonly code: string; readonly label: string };

type Props = {
  /** Form field name for the 5-digit code. */
  name: string;
  label: string;
  /** Current value, e.g. from the profile. */
  defaultValue?: MunicipalityOption | null;
  hint?: string;
  error?: string;
};

const DEBOUNCE_MS = 200;

function isOption(value: unknown): value is MunicipalityOption {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "label" in value &&
    typeof value.code === "string" &&
    typeof value.label === "string"
  );
}

async function search(q: string, signal: AbortSignal): Promise<readonly MunicipalityOption[]> {
  const res = await fetch(`/api/municipalities?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error(`MUNICIPALITY_SEARCH_${res.status}`);
  const body: unknown = await res.json();
  return Array.isArray(body) ? body.filter(isOption) : [];
}

/** Text field with typeahead over the 1,122 DIVIPOLA entries. */
export function MunicipalityPicker({ name, label, defaultValue = null, hint, error }: Props) {
  const id = useId();
  const listId = `${id}-options`;
  const [query, setQuery] = useState(defaultValue?.label ?? "");
  const [selected, setSelected] = useState<MunicipalityOption | null>(defaultValue);
  const [options, setOptions] = useState<readonly MunicipalityOption[]>([]);
  const [failed, setFailed] = useState(false);
  const typed = useRef(false);

  useEffect(() => {
    const q = query.trim();
    if (!typed.current || q.length < 2 || selected?.label === query) return undefined;
    const controller = new AbortController();
    const run = async (): Promise<void> => {
      try {
        setOptions(await search(q, controller.signal));
        setFailed(false);
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
      }
    };
    const timer = setTimeout(() => void run(), DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);

  const message = error ?? (failed ? "No pudimos buscar. Revisa tu conexión." : hint);

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] text-label-2">{label}</span>
      <input
        id={id}
        type="text"
        list={listId}
        autoComplete="off"
        placeholder="Escribe tu municipio"
        aria-invalid={error ? true : undefined}
        value={query}
        onChange={(e) => {
          typed.current = true;
          const value = e.target.value;
          setQuery(value);
          // Picking a suggestion fills the input with its exact label.
          setSelected(options.find((o) => o.label === value) ?? null);
        }}
        className="h-12 w-full rounded-[var(--radius-sm)] bg-surface-2 px-4 text-[17px] text-label placeholder:text-label-3 outline-none focus:ring-2 focus:ring-blue aria-[invalid]:ring-2 aria-[invalid]:ring-red"
      />
      <datalist id={listId}>
        {options.map((option) => (
          // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the label is the option's text; the rule can't read a JSX expression as text
          <option key={option.code} value={option.label}>
            {option.label}
          </option>
        ))}
      </datalist>
      <input type="hidden" name={name} value={selected?.code ?? ""} />
      {message && (
        <span className={`mt-1.5 block text-[13px] ${error || failed ? "text-red" : "text-label-2"}`}>
          {message}
        </span>
      )}
    </label>
  );
}
