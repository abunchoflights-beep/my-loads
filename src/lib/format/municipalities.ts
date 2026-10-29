// Subset of DANE DIVIPOLA codes for display while S1-06 loads the full
// table into the database. Unknown codes fall back to the raw code.
const MUNICIPALITIES: Record<string, string> = {
  "05001": "Medellín, Antioquia",
  "05045": "Apartadó, Antioquia",
  "05837": "Turbo, Antioquia",
  "08001": "Barranquilla, Atlántico",
  "11001": "Bogotá, D.C.",
  "13001": "Cartagena, Bolívar",
  "15001": "Tunja, Boyacá",
  "17001": "Manizales, Caldas",
  "19001": "Popayán, Cauca",
  "23001": "Montería, Córdoba",
  "41001": "Neiva, Huila",
  "47001": "Santa Marta, Magdalena",
  "50001": "Villavicencio, Meta",
  "52001": "Pasto, Nariño",
  "54001": "Cúcuta, Norte de Santander",
  "63001": "Armenia, Quindío",
  "66001": "Pereira, Risaralda",
  "68001": "Bucaramanga, Santander",
  "73001": "Ibagué, Tolima",
  "76001": "Cali, Valle del Cauca",
};

export function municipalityName(code: string | null | undefined): string {
  if (!code) return "Sin municipio";
  return MUNICIPALITIES[code] ?? code;
}
