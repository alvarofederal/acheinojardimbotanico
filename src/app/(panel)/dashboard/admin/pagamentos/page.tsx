import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { PaymentsTable } from "./_components/payments-table"
import { PaymentHistory } from "./_components/payment-history"
import { formatBRL, priceCentsFor, type PlanId } from "@/lib/plans"
import { Settings, TrendingUp, Wallet, CalendarClock, Users } from "lucide-react"

export default async function AdminPagamentosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [pending, history, config, confirmedAgg, monthAgg, activeBusinesses] = await Promise.all([
    db.paymentClaim.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.paymentClaim.findMany({
      where: { status: { in: ["CONFIRMED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 100,
    }),
    db.paymentConfig.findUnique({ where: { id: "default" } }),
    db.paymentClaim.aggregate({ where: { status: "CONFIRMED" }, _sum: { amountCents: true }, _count: true }),
    db.paymentClaim.aggregate({
      where: { status: "CONFIRMED", reviewedAt: { gte: monthStart } },
      _sum: { amountCents: true },
    }),
    db.business.findMany({
      where: { plan: { in: ["VISIBILITY", "PREMIUM"] }, planExpiresAt: { gt: now } },
      select: { plan: true },
    }),
  ])

  // MRR = soma do preço mensal de cada negócio com plano pago ativo
  const cfg = config ? { visibilityCents: config.visibilityCents, premiumCents: config.premiumCents } : null
  const mrrCents = activeBusinesses.reduce((sum, b) => sum + priceCentsFor(b.plan as PlanId, cfg), 0)

  const totalReceived = confirmedAgg._sum.amountCents ?? 0
  const monthReceived = monthAgg._sum.amountCents ?? 0
  const confirmedCount = confirmedAgg._count

  // ---- enriquecimento de nomes (negócio/usuário) para pendentes + histórico ----
  const allClaims = [...pending, ...history]
  const businessIds = [...new Set(allClaims.map(c => c.businessId))]
  const userIds = [...new Set(allClaims.map(c => c.userId))]
  const [businesses, users] = await Promise.all([
    db.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, name: true, neighborhood: true } }),
    db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
  ])
  const bMap = new Map(businesses.map(b => [b.id, b]))
  const uMap = new Map(users.map(u => [u.id, u]))

  const enrich = (c: typeof allClaims[number]) => ({
    id: c.id, plan: c.plan, method: c.method, months: c.months, amountCents: c.amountCents,
    status: c.status, note: c.note, createdAt: c.createdAt, reviewedAt: c.reviewedAt,
    business: bMap.get(c.businessId) ?? { name: "—", neighborhood: "" },
    user: uMap.get(c.userId) ?? { name: null, email: null },
  })

  const pendingItems = pending.map(enrich)
  const historyItems = history.map(enrich)

  const stats = [
    { label: "Total recebido", value: formatBRL(totalReceived), sub: `${confirmedCount} pagamento${confirmedCount === 1 ? "" : "s"}`, icon: Wallet, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Recebido este mês", value: formatBRL(monthReceived), sub: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), icon: CalendarClock, color: "text-flora-green dark:text-flora-fresh" },
    { label: "Receita recorrente (MRR)", value: formatBRL(mrrCents), sub: "estimativa mensal", icon: TrendingUp, color: "text-amber-600 dark:text-amber-400" },
    { label: "Assinantes ativos", value: String(activeBusinesses.length), sub: "planos pagos vigentes", icon: Users, color: "text-sky-600 dark:text-sky-400" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Pagamentos</h1>
          <p className="dash-subtitle mt-0.5 text-sm">{pending.length} aguardando confirmação</p>
        </div>
        <Link href="/dashboard/admin/pagamento"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0">
          <Settings className="w-3.5 h-3.5" /> Configurar cobrança
        </Link>
      </div>

      {/* Dashboard de receita */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xs dash-muted leading-tight">{s.label}</p>
            </div>
            <p className="font-serif text-xl sm:text-2xl font-bold dash-title leading-none">{s.value}</p>
            <p className="text-[11px] dash-muted mt-1 capitalize">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Pendentes */}
      <div>
        <h2 className="text-sm font-semibold dash-title mb-3">Aguardando confirmação</h2>
        <PaymentsTable claims={pendingItems} />
      </div>

      {/* Histórico */}
      <PaymentHistory items={historyItems} />
    </div>
  )
}

export const revalidate = 0
