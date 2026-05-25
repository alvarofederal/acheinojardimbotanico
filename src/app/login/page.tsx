import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./_components/login-form"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { MonsteraLeaf, FernFrond } from "@/app/(public)/_components/botanicals"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="min-h-screen flora-bg flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Botânica de fundo */}
      <MonsteraLeaf className="absolute -left-16 -top-10 w-64 h-64 text-flora-green/10 dark:text-flora-fresh/10 flora-wind" />
      <FernFrond className="absolute right-[6%] -bottom-10 w-24 h-64 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "1.5s" }} />

      <div className="relative w-full max-w-md flora-card rounded-3xl p-8 z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-flora-green/10 dark:bg-flora-fresh/15">
              <Leaf className="w-5 h-5 text-flora-green dark:text-flora-fresh" strokeWidth={2.2} />
            </span>
            <span className="font-serif text-xl font-semibold flora-ink leading-none">
              Achei no <span className="text-flora-green dark:text-flora-fresh italic">Jardim Botânico</span>
            </span>
          </Link>
          <p className="text-sm mt-3 flora-muted">Bem-vindo de volta 🌿</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm mt-6 flora-muted">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold text-flora-green dark:text-flora-fresh hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
