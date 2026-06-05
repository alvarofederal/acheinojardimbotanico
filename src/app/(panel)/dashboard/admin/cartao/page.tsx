import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ACHEI_CARD } from "@/lib/achei-card"
import { CartaoHub } from "./_components/cartao-hub"

export const dynamic = "force-dynamic"

export default async function AdminCartaoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Cartões</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Gere o seu cartão ou o de qualquer negócio pela busca — imprime em folha A4 e corta.</p>
      </div>
      <CartaoHub acheiCard={ACHEI_CARD} />
    </div>
  )
}
