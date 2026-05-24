import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { COST_USD, KIND_LABEL, USD_BRL, FREE_CREDIT_USD, toBrl, type ApiKind } from "@/lib/api-costs"
import { DollarSign, Search, Image as ImageIcon, AlertTriangle, TrendingUp } from "lucide-react"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const usd = (v: number) => "US$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function CustosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Uso agregado por tipo (total e do mês)
  const [byKind, byKindMonth, totalBusinesses, totalPhotos, views7d] = await Promise.all([
    db.apiUsage.groupBy({ by: ["kind"], _sum: { units: true, results: true, costUsd: true } }),
    db.apiUsage.groupBy({ by: ["kind"], where: { createdAt: { gte: monthStart } }, _sum: { units: true, costUsd: true } }),
    db.business.count(),
    db.photo.count({ where: { source: "GOOGLE_PLACES" } }),
    db.businessView.aggregate({ where: { date: { gte: new Date(Date.now() - 7 * 864e5) } }, _sum: { count: true } }),
  ])

  const searchCostUsd = byKind.reduce((s, k) => s + (k._sum.costUsd ?? 0), 0)
  const searchCostMonthUsd = byKindMonth.reduce((s, k) => s + (k._sum.costUsd ?? 0), 0)
  const totalUnits = byKind.reduce((s, k) => s + (k._sum.units ?? 0), 0)
  const totalResults = byKind.reduce((s, k) => s + (k._sum.results ?? 0), 0)

  // Estimativa de custo de FOTOS exibidas (browser chama o Google a cada view).
  // Aproximação: visualizações de negócio (7d) × ~1 foto na listagem + galeria.
  const viewsCount = views7d._sum.count ?? 0
  const estPhotoCostMonthUsd = COST_USD.PHOTO * viewsCount * 4 * (30 / 7) // ~4 fotos/visualização, extrapolado p/ mês

  const costPerBusinessUsd = totalResults > 0 ? searchCostUsd / totalResults : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Custos da API Google</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Estimativa de gastos com importação e exibição de fotos</p>
      </div>

      {/* Destaques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gasto total (buscas)", value: brl(toBrl(searchCostUsd)), sub: usd(searchCostUsd), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Buscas este mês", value: brl(toBrl(searchCostMonthUsd)), sub: usd(searchCostMonthUsd), icon: Search, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Custo por negócio", value: brl(toBrl(costPerBusinessUsd)), sub: `${totalResults} retornados`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
          { label: "Fotos exibidas/mês (est.)", value: brl(toBrl(estPhotoCostMonthUsd)), sub: usd(estPhotoCostMonthUsd), icon: ImageIcon, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold dash-title">{s.value}</p>
            <p className="text-xs dash-muted mt-0.5">{s.label}</p>
            <p className="text-[11px] dash-muted/70 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Crédito gratuito */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-4 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            Crédito gratuito: {brl(toBrl(FREE_CREDIT_USD))}/mês ({usd(FREE_CREDIT_USD)})
          </p>
          <p className="text-emerald-700/80 dark:text-emerald-400/70 text-xs mt-0.5">
            Gasto do mês até agora (buscas): <strong>{brl(toBrl(searchCostMonthUsd))}</strong>.
            {searchCostMonthUsd < FREE_CREDIT_USD
              ? ` Restam ~${brl(toBrl(FREE_CREDIT_USD - searchCostMonthUsd))} de crédito.`
              : " ⚠️ Crédito do mês esgotado — gastos serão cobrados."}
          </p>
        </div>
      </div>

      {/* Detalhe por tipo */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
          <h2 className="text-sm font-semibold dash-title">Detalhamento por tipo de chamada</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.07] text-xs text-gray-500 dark:text-white/40 uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-semibold">Tipo</th>
              <th className="text-right px-4 py-2.5 font-semibold">Chamadas</th>
              <th className="text-right px-4 py-2.5 font-semibold">Preço/un.</th>
              <th className="text-right px-4 py-2.5 font-semibold">Custo total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {byKind.map(k => (
              <tr key={k.kind}>
                <td className="px-4 py-2.5 dash-title font-medium">{KIND_LABEL[k.kind as ApiKind] ?? k.kind}</td>
                <td className="px-4 py-2.5 text-right dash-subtitle">{(k._sum.units ?? 0).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2.5 text-right dash-muted">{usd(COST_USD[k.kind as ApiKind] ?? 0)}</td>
                <td className="px-4 py-2.5 text-right dash-title font-semibold">{brl(toBrl(k._sum.costUsd ?? 0))}</td>
              </tr>
            ))}
            {byKind.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center dash-muted">Nenhuma importação registrada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Aviso de metodologia */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.05] p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800/90 dark:text-amber-300/80 space-y-1">
          <p><strong>Como ler:</strong> os custos de busca são registrados a cada importação (precisos). O custo de fotos é uma <strong>estimativa</strong> — cada foto exibida no site chama o Google. Câmbio: US$ 1 = {brl(USD_BRL)}.</p>
          <p>Valores são estimativas para planejamento. Confira a fatura real em <span className="font-mono">console.cloud.google.com/billing</span>. Ajuste os preços em <span className="font-mono">src/lib/api-costs.ts</span>.</p>
        </div>
      </div>

      <p className="text-xs dash-muted">
        Base atual: <strong className="dash-title">{totalBusinesses}</strong> negócios · <strong className="dash-title">{totalPhotos}</strong> fotos · <strong className="dash-title">{totalUnits}</strong> chamadas de busca acumuladas.
      </p>
    </div>
  )
}
