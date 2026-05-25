import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./_components/login-form"
import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <AuthShell
      subtitle="Bem-vindo de volta 🌿"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold text-flora-green dark:text-flora-fresh hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
