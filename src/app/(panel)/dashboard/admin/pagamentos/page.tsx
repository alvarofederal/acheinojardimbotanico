import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { PaymentsTable } from "./_components/payments-table"
import { Settings } from "lucide-react"

export default async function AdminPagamentosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const claims = await db.paymentClaim.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  })

  // Busca dados de negócio/usuário (sem relations no schema do claim)
  const businessIds = [...new Set(claims.map(c => c.businessId))]
  const userIds = [...new Set(claims.map(c => c.userId))]
  const [businesses, users] = await Promise.all([
    db.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, name: true, neighborhood: true } }),
    db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
  ])
  const bMap = new Map(businesses.map(b => [b.id, b]))
  const uMap = new Map(users.map(u => [u.id, u]))

  const enriched = claims.map(c => ({
    id: c.id, plan: c.plan, method: c.method, months: c.months, amountCents: c.amountCents,
    note: c.note, createdAt: c.createdAt,
    business: bMap.get(c.businessId) ?? { name: "—", neighborhood: "" },
    user: uMap.get(c.userId) ?? { name: null, email: null },
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Pagamentos</h1>
          <p className="dash-subtitle mt-0.5 text-sm">{claims.length} aguardando confirmação</p>
        </div>
        <Link href="/dashboard/admin/pagamento"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0">
          <Settings className="w-3.5 h-3.5" /> Configurar cobrança
        </Link>
      </div>
      <PaymentsTable claims={enriched} />
    </div>
  )
}
