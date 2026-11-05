const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const kg = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const day = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

export const formatCop = (value: number | bigint | string) => cop.format(Number(value));
export const formatKg = (value: number | string) => `${kg.format(Number(value))} kg`;
export const formatDay = (iso: string) => day.format(new Date(iso + (iso.length === 10 ? "T12:00:00" : "")));

/** The parts of a `municipalities` row needed to display it. */
export type MunicipalityLabel = { readonly name: string; readonly department_name: string };

/**
 * "Apartadó, Antioquia". Bogotá is its own department, so it reads "Bogotá, D.C." once.
 *
 * @param municipality - Embedded municipalities row, or null when the code is missing.
 */
export function formatMunicipality(municipality: MunicipalityLabel | null | undefined): string {
  if (!municipality) return "Sin municipio";
  const { name, department_name: department } = municipality;
  return name === department ? name : `${name}, ${department}`;
}

/**
 * Shows only the last characters of a private value: "••••4050".
 * Used on read-only verification screens (S1-02) so PII isn't on display.
 *
 * @param value - Document number or phone.
 * @param visible - How many trailing characters stay visible.
 */
export function maskTail(value: string | null | undefined, visible = 4): string {
  if (!value) return "—";
  const tail = value.slice(-visible);
  return `••••${tail}`;
}
