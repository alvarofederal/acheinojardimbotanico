import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RegisterForm } from "./_components/register-form"
import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <AuthShell
      subtitle="Crie sua conta grátis 🌿"
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-flora-green dark:text-flora-fresh hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
