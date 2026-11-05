import { describe, expect, it } from "vite-plus/test";
import { formatMunicipality, maskTail } from "@/lib/format";

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

describe("maskTail (S1-02)", () => {
  it("keeps only the last four characters", () => {
    expect(maskTail("1020304050")).toBe("••••4050");
    expect(maskTail("+573001234567")).toBe("••••4567");
  });

  it("shows a dash when there is nothing", () => {
    expect(maskTail(null)).toBe("—");
  });
});
