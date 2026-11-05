import { describe, expect, it } from "vite-plus/test";
import { resolveAccess } from "@/lib/auth/access";

const farmer = { role: "farmer", aal: "aal1", mfa: false } as const;
const buyer = { role: "buyer", aal: "aal1", mfa: false } as const;
const carrier = { role: "carrier", aal: "aal1", mfa: false } as const;
const admin1 = { role: "admin", aal: "aal1", mfa: false } as const;
const admin2 = { role: "admin", aal: "aal2", mfa: true } as const;
// Enrolled in MFA (S1-05): aal1 right after the password, aal2 after the code.
const farmerNeedsCode = { role: "farmer", aal: "aal1", mfa: true } as const;
const farmerWithCode = { role: "farmer", aal: "aal2", mfa: true } as const;
const adminNeedsCode = { role: "admin", aal: "aal1", mfa: true } as const;

describe("resolveAccess", () => {
  it("lets anyone see the landing, login and legal pages", () => {
    expect(resolveAccess("/", null)).toEqual({ kind: "allow" });
    expect(resolveAccess("/login", null)).toEqual({ kind: "allow" });
    expect(resolveAccess("/legal/privacy", null)).toEqual({ kind: "allow" });
  });

  it("sends anonymous visitors of private pages to login with next", () => {
    expect(resolveAccess("/farmer/listings", null)).toEqual({
      kind: "redirect",
      to: "/login?next=%2Ffarmer%2Flistings",
    });
  });

  it("sends signed-in users from / and /login to their home", () => {
    expect(resolveAccess("/", carrier)).toEqual({ kind: "redirect", to: "/loads" });
    expect(resolveAccess("/login", buyer)).toEqual({ kind: "redirect", to: "/market" });
  });

  it("keeps each role inside its own area", () => {
    expect(resolveAccess("/farmer", buyer)).toEqual({ kind: "redirect", to: "/market" });
    expect(resolveAccess("/loads", farmer)).toEqual({ kind: "redirect", to: "/farmer" });
    expect(resolveAccess("/buyer/orders", carrier)).toEqual({ kind: "redirect", to: "/loads" });
    expect(resolveAccess("/admin", farmer)).toEqual({ kind: "redirect", to: "/farmer" });
  });

  it("lets farmers see market prices but not carriers", () => {
    expect(resolveAccess("/market", farmer)).toEqual({ kind: "allow" });
    expect(resolveAccess("/market", carrier)).toEqual({ kind: "redirect", to: "/loads" });
  });

  it("does not match on loose prefixes", () => {
    expect(resolveAccess("/farmerx", buyer)).toEqual({ kind: "allow" }); // falls through to 404
    expect(resolveAccess("/loadsheet", farmer)).toEqual({ kind: "allow" });
  });

  it("requires MFA (aal2) for admin screens", () => {
    expect(resolveAccess("/admin/verifications", admin1)).toEqual({
      kind: "redirect",
      to: "/account/security?next=%2Fadmin%2Fverifications",
    });
    expect(resolveAccess("/admin/verifications", admin2)).toEqual({ kind: "allow" });
  });

  it("sends enrolled users to the code challenge before any app screen", () => {
    expect(resolveAccess("/farmer/listings", farmerNeedsCode)).toEqual({
      kind: "redirect",
      to: "/account/security?next=%2Ffarmer%2Flistings",
    });
    expect(resolveAccess("/account", farmerNeedsCode)).toEqual({
      kind: "redirect",
      to: "/account/security?next=%2Faccount",
    });
    expect(resolveAccess("/api/municipalities", farmerNeedsCode)).toEqual({
      kind: "redirect",
      to: "/account/security?next=%2Fapi%2Fmunicipalities",
    });
  });

  it("lets enrolled users at aal1 reach the challenge, sign out and legal pages", () => {
    expect(resolveAccess("/account/security", farmerNeedsCode)).toEqual({ kind: "allow" });
    expect(resolveAccess("/auth/signout", farmerNeedsCode)).toEqual({ kind: "allow" });
    expect(resolveAccess("/legal/privacy", farmerNeedsCode)).toEqual({ kind: "allow" });
  });

  it("lets enrolled users through once they passed the code", () => {
    expect(resolveAccess("/farmer/listings", farmerWithCode)).toEqual({ kind: "allow" });
  });

  it("does not ask for a code from users without MFA", () => {
    expect(resolveAccess("/farmer/listings", farmer)).toEqual({ kind: "allow" });
  });

  it("sends an enrolled admin at aal1 to the challenge, then back", () => {
    expect(resolveAccess("/admin", adminNeedsCode)).toEqual({
      kind: "redirect",
      to: "/account/security?next=%2Fadmin",
    });
    expect(resolveAccess("/admin", admin2)).toEqual({ kind: "allow" });
  });
});
