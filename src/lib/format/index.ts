const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const kg = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const day = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

export const formatCop = (value: number | bigint | string) => cop.format(Number(value));
export const formatKg = (value: number | string) => `${kg.format(Number(value))} kg`;
export const formatDay = (iso: string) => day.format(new Date(iso + (iso.length === 10 ? "T12:00:00" : "")));
