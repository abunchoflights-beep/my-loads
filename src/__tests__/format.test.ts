import { describe, expect, it } from "vite-plus/test";
import { formatMunicipality } from "@/lib/format";

describe("formatMunicipality (S1-06)", () => {
  it("joins municipality and department", () => {
    expect(formatMunicipality({ name: "Apartadó", department_name: "Antioquia" })).toBe(
      "Apartadó, Antioquia",
    );
  });

  it("names Bogotá once", () => {
    expect(formatMunicipality({ name: "Bogotá, D.C.", department_name: "Bogotá, D.C." })).toBe(
      "Bogotá, D.C.",
    );
  });

  it("says so when there is no municipality", () => {
    expect(formatMunicipality(null)).toBe("Sin municipio");
  });
});
