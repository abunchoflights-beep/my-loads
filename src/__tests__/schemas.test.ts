import { describe, expect, it } from "vite-plus/test";
import { municipalitySearchSchema, updateMunicipalitySchema } from "@/lib/schemas/municipalities";
import { removeFactorSchema, totpCodeSchema, verifyTotpSchema } from "@/lib/schemas/mfa";
import { normalizeDocumentNumber, normalizePhone, verificationFormSchema } from "@/lib/schemas/verification";

describe("municipality contracts (S1-06)", () => {
  it("accepts 2 to 40 characters to search, trimmed", () => {
    expect(municipalitySearchSchema.parse({ q: "  apar " })).toEqual({ q: "apar" });
    expect(municipalitySearchSchema.safeParse({ q: "a" }).success).toBe(false);
    expect(municipalitySearchSchema.safeParse({ q: "x".repeat(41) }).success).toBe(false);
  });

  it("only takes 5-digit DANE codes", () => {
    expect(updateMunicipalitySchema.safeParse({ municipalityCode: "05045" }).success).toBe(true);
    expect(updateMunicipalitySchema.safeParse({ municipalityCode: "5045" }).success).toBe(false);
    expect(updateMunicipalitySchema.safeParse({ municipalityCode: "05045'--" }).success).toBe(false);
  });
});

describe("verification contract (S1-02)", () => {
  it.each([
    ["300 123 4567", "+573001234567"],
    ["(300) 123-4567", "+573001234567"],
    ["573001234567", "+573001234567"],
    ["+57 300 123 4567", "+573001234567"],
    ["+1 415 555 0100", "+14155550100"],
  ])("normalizes the phone %s", (raw, e164) => {
    expect(normalizePhone(raw)).toBe(e164);
  });

  it.each(["1234567", "6012345678", "abc", "+0123"])("rejects the phone %s", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });

  it("strips the dots people type in a cédula", () => {
    expect(normalizeDocumentNumber("1.020.304.050")).toBe("1020304050");
    expect(normalizeDocumentNumber("ab 123")).toBe("AB123");
  });

  it("parses a complete form into database-ready values", () => {
    const parsed = verificationFormSchema.parse({
      legalName: "  Rosa Úsuga ",
      documentType: "CC",
      documentNumber: "43.111.222",
      phone: "310 444 5566",
    });
    expect(parsed).toEqual({
      legalName: "Rosa Úsuga",
      documentType: "CC",
      documentNumber: "43111222",
      phone: "+573104445566",
    });
  });

  it("reports each bad field", () => {
    const result = verificationFormSchema.safeParse({
      legalName: "R",
      documentType: "LICENCIA",
      documentNumber: "1;drop",
      phone: "123",
    });
    expect(result.success).toBe(false);
    const fields = new Set(result.error?.issues.map((i) => String(i.path[0])));
    expect(fields).toEqual(new Set(["legalName", "documentType", "documentNumber", "phone"]));
  });
});

describe("MFA contracts (S1-05)", () => {
  it("takes 6 digits and ignores spaces", () => {
    expect(totpCodeSchema.parse("123 456")).toBe("123456");
    expect(totpCodeSchema.safeParse("12345").success).toBe(false);
    expect(totpCodeSchema.safeParse("12a456").success).toBe(false);
  });

  it("keeps next as-is for safeNextPath to judge", () => {
    expect(verifyTotpSchema.parse({ code: "123456", next: "/admin" })).toEqual({
      code: "123456",
      next: "/admin",
    });
  });

  it("requires a factor id and a current code to remove a factor", () => {
    expect(removeFactorSchema.safeParse({ factorId: "not-a-uuid", code: "123456" }).success).toBe(false);
    expect(
      removeFactorSchema.safeParse({ factorId: "0b9f1a2c-3d4e-4f50-8a6b-7c8d9e0f1a2b", code: "" }).success,
    ).toBe(false);
  });
});
