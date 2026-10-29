import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role } = await searchParams;
  const initialRole = role === "buyer" || role === "carrier" ? role : "farmer";
  return (
    <>
      <h1 className="large-title mb-2">Crear cuenta</h1>
      <p className="mb-8 text-[17px] text-label-2">Cuéntanos qué haces. Esto no se puede cambiar después.</p>
      <SignupForm initialRole={initialRole} />
    </>
  );
}
