import Link from "next/link"
import { ForgotForm } from "./_components/forgot-form"
import { AuthShell } from "@/components/auth-shell"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      subtitle="Recuperar senha"
      footer={
        <Link href="/login" className="font-semibold text-flora-green dark:text-flora-fresh hover:underline">
          Voltar ao login
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  )
}
