import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { CardCard } from "@/components/card-card"
import { ACHEI_CARD } from "@/lib/achei-card"
import { Printer, CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminCartaoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Cartão do Achei</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Seu cartão de visita — modelo de teste da funcionalidade.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-sm dash-subtitle space-y-1">
          <p className="font-medium dash-title">Como usar:</p>
          <p>1. Clique em <strong>Imprimir</strong> e escolha o tamanho <strong>9×5 cm</strong> (cartão de visita).</p>
          <p>2. Para PDF, escolha <strong>&quot;Salvar como PDF&quot;</strong>.</p>
          <p>3. O número de WhatsApp está como exemplo — me passe o real que eu finalizo.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="rounded-xl shadow-lg" style={{ boxShadow: "0 10px 40px rgba(30,92,69,0.18)" }}>
          <CardCard data={ACHEI_CARD} />
        </div>
        <Link href="/card-print/achei" target="_blank"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
        </Link>
      </div>
    </div>
  )
}
