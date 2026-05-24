import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ConfigForm } from "./_components/config-form"

export default async function PagamentoConfigPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const config = await db.paymentConfig.findUnique({ where: { id: "default" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Configurar Cobrança</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Defina como os anunciantes vão pagar (PIX e cartão)</p>
      </div>
      <ConfigForm config={config} />
    </div>
  )
}
