import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="large-title mb-8">Ingresar</h1>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
