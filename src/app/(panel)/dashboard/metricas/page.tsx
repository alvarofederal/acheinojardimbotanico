import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { RoiChart } from "./_components/roi-chart"
import { FeatureLocked } from "../_components/feature-locked"
import { planHasFeature } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { Eye, MessageCircle, TrendingUp, Store, Zap, ArrowUpRight, ArrowDownRight, Sparkles, Megaphone, ShoppingBag } from "lucide-react"

function dayKey(d: Date) { return d.toISOString().slice(0, 10) }

export default async function MetricasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, plan: true, handle: true },
  })

  if (!business) return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Seu Resultado</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para acompanhar seu resultado.</p>
        <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  if (!(await planHasFeature(business.plan as PlanId, "metricas")))
    return <FeatureLocked title="Seu Resultado" feature="Métricas / ROI" />

  const now = new Date()
  const day = 86400000
  const startN = (n: number) => { const d = new Date(now); d.setDate(now.getDate() - n); d.setHours(0, 0, 0, 0); return d }
  const start7 = startN(7), start14 = startN(14), start30 = startN(30), start60 = startN(60)

  const [views, clicks, links] = await Promise.all([
    db.businessView.findMany({ where: { businessId: business.id, date: { gte: start60 } }, select: { date: true, count: true } }),
    db.whatsappClick.findMany({ where: { businessId: business.id, date: { gte: start60 } }, select: { date: true, count: true } }),
    db.linkClick.findMany({ where: { businessId: business.id, date: { gte: start60 } }, select: { date: true, kind: true, count: true } }),
  ])

  const vMap = new Map(views.map(v => [dayKey(new Date(v.date)), v.count]))
  const cMap = new Map(clicks.map(c => [dayKey(new Date(c.date)), c.count]))
  const kindMap = (k: string) => new Map(links.filter(l => l.kind === k).map(l => [dayKey(new Date(l.date)), l.count]))
  const ifoodMap = kindMap("ifood")
  const ofertaMap = kindMap("oferta")

  const sumRange = (map: Map<string, number>, from: Date, to: Date) => {
    let s = 0
    for (const [k, n] of map) { const d = new Date(k); if (d >= from && d < to) s += n }
    return s
  }

  // Semana atual vs semana passada (o foco de renovação)
  const views7 = sumRange(vMap, start7, now)
  const clicks7 = sumRange(cMap, start7, now)
  const viewsPrev7 = sumRange(vMap, start14, start7)
  const clicksPrev7 = sumRange(cMap, start14, start7)
  // Mês (secundário)
  const views30 = sumRange(vMap, start30, now)
  const clicks30 = sumRange(cMap, start30, now)
  const viewsPrev30 = sumRange(vMap, start60, start30)
  const clicksPrev30 = sumRange(cMap, start60, start30)

  const conv7 = views7 > 0 ? (clicks7 / views7) * 100 : 0
  const delta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100)

  // Canais externos (iFood, Oferta) — só mostra a quebra se houver atividade
  const ifood7 = sumRange(ifoodMap, start7, now)
  const oferta7 = sumRange(ofertaMap, start7, now)
  const ifood30 = sumRange(ifoodMap, start30, now)
  const oferta30 = sumRange(ofertaMap, start30, now)
  const hasChannels = ifood30 > 0 || oferta30 > 0

  // Frase de comparação semanal — prioriza contatos (a métrica que vira dinheiro)
  let weekMsg: string
  if (clicks7 === 0 && views7 === 0) {
    weekMsg = "Sem movimento nos últimos 7 dias. Capriche nas fotos, na descrição e publique uma oferta para aparecer mais."
  } else if (clicksPrev7 === 0 && clicks7 > 0) {
    weekMsg = `A semana passada não teve nenhum contato — esta já tem ${clicks7}. Bom sinal!`
  } else if (clicks7 > 0) {
    const d = delta(clicks7, clicksPrev7)
    weekMsg = d > 0 ? `São ${d}% mais contatos que a semana passada. Continue assim!`
      : d < 0 ? `Foram ${Math.abs(d)}% menos contatos que a semana passada — que tal publicar uma oferta para animar?`
      : "Mesmo ritmo de contatos da semana passada."
  } else {
    const d = delta(views7, viewsPrev7)
    weekMsg = d >= 0
      ? "Gente te encontrando, mas ainda sem contato no WhatsApp. Uma oferta com prazo costuma destravar."
      : "Menos visitas que a semana passada — uma oferta em destaque ajuda a reaquecer."
  }

  // Série dos últimos 14 dias (gráfico)
  const chart = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(now.getTime() - (13 - i) * day); d.setHours(0, 0, 0, 0)
    const k = dayKey(d)
    return { label: `${d.getDate()}/${d.getMonth() + 1}`, views: vMap.get(k) ?? 0, clicks: cMap.get(k) ?? 0 }
  })

  const week = [
    { label: "Te acharam", value: views7, prev: viewsPrev7, icon: Eye, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", hint: "pessoas viram seu perfil" },
    { label: "Falaram com você", value: clicks7, prev: clicksPrev7, icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", hint: "contatos no WhatsApp" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Seu Resultado</h1>
        <p className="dash-subtitle mt-0.5 text-sm">O que o guia trouxe para <strong className="dash-title">{business.name}</strong></p>
      </div>

      {/* HERO semanal — a arma de renovação */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-50/80 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Últimos 7 dias
        </p>
        {(views7 > 0 || clicks7 > 0) ? (
          <p className="text-lg sm:text-2xl font-semibold mt-2 leading-snug">
            <b>{views7.toLocaleString("pt-BR")}</b> {views7 === 1 ? "pessoa encontrou" : "pessoas encontraram"} sua loja no guia
            {clicks7 > 0 && <> e <b>{clicks7.toLocaleString("pt-BR")}</b> {clicks7 === 1 ? "falou" : "falaram"} com você no WhatsApp</>}.
          </p>
        ) : (
          <p className="text-lg sm:text-2xl font-semibold mt-2 leading-snug">Sua loja ainda não teve movimento esta semana.</p>
        )}
        <p className="text-emerald-50 text-sm mt-2">{weekMsg}</p>
      </div>

      {/* Esta semana vs a passada */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide dash-muted mb-2.5">Esta semana vs a passada</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {week.map(s => {
            const d = delta(s.value, s.prev)
            const up = d >= 0
            return (
              <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-3xl font-bold dash-title">{s.value.toLocaleString("pt-BR")}</p>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className="text-xs dash-muted">{s.label} <span className="opacity-70">· {s.hint}</span></p>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 flex-shrink-0 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(d)}%
                  </span>
                </div>
              </div>
            )
          })}
          {/* Conversão da semana */}
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold dash-title">{conv7.toFixed(1)}%</p>
            <p className="text-xs dash-muted mt-1">viraram contato (de quem te achou)</p>
          </div>
        </div>
      </div>

      {/* Por canal (só se houver iFood / Oferta) */}
      {hasChannels && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide dash-muted mb-2.5">Por canal (7 dias)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "WhatsApp", value: clicks7, Icon: MessageCircle, color: "text-emerald-500" },
              { label: "iFood", value: ifood7, Icon: ShoppingBag, color: "text-[#EA1D2C]" },
              { label: "Oferta", value: oferta7, Icon: Megaphone, color: "text-flora-gold" },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4 text-center">
                <c.Icon className={`w-4 h-4 ${c.color} mx-auto mb-1.5`} />
                <p className="text-2xl font-bold dash-title leading-none">{c.value.toLocaleString("pt-BR")}</p>
                <p className="text-[11px] dash-muted mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No mês (secundário) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide dash-muted mb-2.5">No mês (30 dias)</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Visualizações", value: views30, prev: viewsPrev30, icon: Eye },
            { label: "Contatos no WhatsApp", value: clicks30, prev: clicksPrev30, icon: MessageCircle },
          ].map(s => {
            const d = delta(s.value, s.prev); const up = d >= 0
            return (
              <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4 flex items-center gap-3">
                <s.icon className="w-4 h-4 dash-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold dash-title leading-none">{s.value.toLocaleString("pt-BR")}</p>
                  <p className="text-[11px] dash-muted mt-1 truncate">{s.label}</p>
                </div>
                <span className={`ml-auto text-[11px] font-semibold flex items-center gap-0.5 flex-shrink-0 ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(d)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gráfico 14 dias */}
      <RoiChart data={chart} />

      {/* Gancho: publicar oferta (renovação/ação) */}
      <Link href="/dashboard/produtos"
        className="rounded-2xl border border-flora-gold/30 bg-flora-gold/[0.06] p-5 flex items-center gap-4 hover:bg-flora-gold/[0.1] transition-colors">
        <Megaphone className="w-6 h-6 text-flora-gold flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold dash-title">Quer mais contatos esta semana?</p>
          <p className="text-sm dash-muted">Publique uma <strong>oferta com prazo</strong> no seu perfil — cria urgência e costuma trazer cliente no mesmo dia.</p>
        </div>
        <span className="text-sm font-semibold text-flora-green dark:text-flora-fresh flex-shrink-0">Criar oferta →</span>
      </Link>

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
