import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { RoiChart } from "./_components/roi-chart"
import { FeatureLocked } from "../_components/feature-locked"
import { planHasFeature } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { Eye, MessageCircle, TrendingUp, Store, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react"

function dayKey(d: Date) { return d.toISOString().slice(0, 10) }

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, plan: true },
  })

  if (!business) return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Métricas</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para acompanhar suas métricas.</p>
        <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  if (!(await planHasFeature(business.plan as PlanId, "metricas")))
    return <FeatureLocked title="Métricas" feature="Métricas / ROI" />

  const now = new Date()
  const start30 = new Date(now); start30.setDate(now.getDate() - 30); start30.setHours(0, 0, 0, 0)
  const start60 = new Date(now); start60.setDate(now.getDate() - 60); start60.setHours(0, 0, 0, 0)

  const [views, clicks] = await Promise.all([
    db.businessView.findMany({ where: { businessId: business.id, date: { gte: start60 } }, select: { date: true, count: true } }),
    db.whatsappClick.findMany({ where: { businessId: business.id, date: { gte: start60 } }, select: { date: true, count: true } }),
  ])

  // Mapas por dia
  const vMap = new Map(views.map(v => [dayKey(new Date(v.date)), v.count]))
  const cMap = new Map(clicks.map(c => [dayKey(new Date(c.date)), c.count]))

  const sumRange = (map: Map<string, number>, from: Date, to: Date) => {
    let s = 0
    for (const [k, n] of map) { const d = new Date(k); if (d >= from && d < to) s += n }
    return s
  }

  const views30 = sumRange(vMap, start30, now)
  const clicks30 = sumRange(cMap, start30, now)
  const viewsPrev = sumRange(vMap, start60, start30)
  const clicksPrev = sumRange(cMap, start60, start30)
  const convRate = views30 > 0 ? (clicks30 / views30) * 100 : 0

  const delta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100)

  // Série dos últimos 14 dias
  const chart = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (13 - i)); d.setHours(0, 0, 0, 0)
    const k = dayKey(d)
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, views: vMap.get(k) ?? 0, clicks: cMap.get(k) ?? 0 }
  })

  const stats = [
    { label: "Visualizações (30d)", value: views30, prev: viewsPrev, icon: Eye, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Contatos no WhatsApp (30d)", value: clicks30, prev: clicksPrev, icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Métricas</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Desempenho de <strong className="dash-title">{business.name}</strong> nos últimos 30 dias</p>
      </div>

      {/* Stats com comparação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const d = delta(s.value, s.prev)
          const up = d >= 0
          return (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold dash-title">{s.value.toLocaleString("pt-BR")}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs dash-muted">{s.label}</p>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(d)}%
                </span>
              </div>
            </div>
          )
        })}
        {/* Taxa de conversão */}
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold dash-title">{convRate.toFixed(1)}%</p>
          <p className="text-xs dash-muted mt-1">Taxa de conversão</p>
        </div>
      </div>

      {/* Insight — o argumento de ROI */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-lg">
              {clicks30 > 0
                ? <>{clicks30} {clicks30 === 1 ? "pessoa entrou" : "pessoas entraram"} em contato pelo WhatsApp este mês</>
                : <>Ainda sem contatos pelo WhatsApp este mês</>}
            </p>
            <p className="text-emerald-50 text-sm mt-1">
              {clicks30 > 0
                ? "Cada contato é um cliente em potencial que encontrou você pelo guia."
                : "Complete seu perfil com fotos e descrição para atrair mais contatos."}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <RoiChart data={chart} />

      {/* Upsell pra plano Free */}
      {business.plan === "FREE" && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-5 flex items-center gap-4">
          <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">Quer aparecer em primeiro?</p>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/70">No plano Visibilidade seu negócio fica no topo da categoria e recebe mais contatos.</p>
          </div>
          <Link href="/dashboard/plano" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex-shrink-0">
            Ver planos
          </Link>
        </div>
      )}
    </div>
  )
}
