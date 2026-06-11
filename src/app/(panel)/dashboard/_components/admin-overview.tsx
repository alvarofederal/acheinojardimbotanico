import Link from "next/link"
import { Radio, Users, CreditCard, ShieldCheck, Building2, Eye, MessageCircle, Clock, TrendingUp, Sprout, Lock, CheckCircle2 } from "lucide-react"

export interface AdminStats {
  online: number
  visitorsTotal: number
  visitorsToday: number
  visitors7d: number
  visitors30d: number
  totalBusinesses: number
  claimed: number
  paying: number
  gatePaying: number // pagantes REAIS (sem cortesia) — régua dos Gates da Rede
  pendingReview: number
  pendingClaims: number
  pendingPayments: number
  pendingEvents: number
  views7d: number
  clicks7d: number
  mrrCents: number
}

/** Os Gates da Rede Achei (docs/rede/plano-de-negocios.md §8) — lembrete visual. */
function GatesCard({ gatePaying }: { gatePaying: number }) {
  const gate1Done = gatePaying >= 10
  const gate2Done = gatePaying >= 20
  const pct = (v: number, alvo: number) => Math.min(100, Math.round((v / alvo) * 100))

  const gates = [
    {
      n: 1, alvo: 10, done: gate1Done, unlocked: true,
      titulo: "Loja-modelo provada",
      regua: `${gatePaying}/10 pagantes reais`,
      pctVal: pct(gatePaying, 10),
      libera: "código multi-tenant da Rede",
    },
    {
      n: 2, alvo: 20, done: gate2Done, unlocked: gate1Done,
      titulo: "História vendável",
      regua: `${gatePaying}/20 pagantes + playbook + lista ≥50`,
      pctVal: pct(gatePaying, 20),
      libera: "vender às 3 praças-piloto",
    },
    {
      n: 3, alvo: 0, done: false, unlocked: false,
      titulo: "Piloto validado",
      regua: "2 de 3 operadores renovando na meta",
      pctVal: 0,
      libera: "escala nacional",
    },
  ]

  return (
    <div className="rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-500/[0.06] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-bold dash-title">Rumo à Rede Achei</p>
        <span className="text-[11px] dash-muted">— os Gates (cada marco libera a próxima aposta)</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {gates.map(g => (
          <div key={g.n} className={`rounded-xl border p-3.5 ${g.done ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/[0.08]" : g.unlocked ? "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]" : "border-dashed border-gray-200 dark:border-white/10 opacity-60"}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {g.done
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                : !g.unlocked
                  ? <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                  : <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 inline-block" />}
              <p className="text-xs font-bold dash-title">Gate {g.n} — {g.titulo}</p>
            </div>
            <p className="text-[11px] dash-muted mb-2">{g.regua}</p>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${g.done ? "bg-emerald-500" : "bg-emerald-400/80"}`} style={{ width: `${g.pctVal}%` }} />
            </div>
            <p className="text-[10px] dash-muted mt-1.5">→ libera: <span className="font-semibold">{g.libera}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function AdminOverview({ s }: { s: AdminStats }) {
  const cards = [
    { label: "Pagantes ativos", value: s.paying.toLocaleString("pt-BR"), icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", href: "/dashboard/admin/pagamentos" },
    { label: "Negócios reivindicados", value: s.claimed.toLocaleString("pt-BR"), icon: ShieldCheck, color: "text-sky-600 dark:text-sky-400", href: "/dashboard/admin/negocios" },
    { label: "Total de negócios", value: s.totalBusinesses.toLocaleString("pt-BR"), icon: Building2, color: "text-purple-600 dark:text-purple-400", href: "/dashboard/admin/negocios" },
    { label: "Receita recorrente (MRR)", value: brl(s.mrrCents), icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", href: "/dashboard/admin/pagamentos" },
  ]

  const pending = [
    { label: "Reivindicações", value: s.pendingClaims, href: "/dashboard/admin/claims" },
    { label: "Pagamentos", value: s.pendingPayments, href: "/dashboard/admin/pagamentos" },
    { label: "Eventos", value: s.pendingEvents, href: "/dashboard/admin/eventos" },
    { label: "Negócios em revisão", value: s.pendingReview, href: "/dashboard/admin/negocios?status=PENDING_REVIEW" },
  ]
  const totalPending = pending.reduce((a, p) => a + p.value, 0)

  return (
    <div className="space-y-5">
      {/* Gates da Rede — o lembrete visual que controla a ansiedade 🌱 */}
      <GatesCard gatePaying={s.gatePaying} />

      {/* Tráfego: online + visitantes */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Online agora */}
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <p className="text-xs dash-muted flex items-center gap-1"><Radio className="w-3.5 h-3.5" /> Online agora</p>
          </div>
          <p className="font-serif text-4xl font-bold dash-title leading-none">{s.online.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] dash-muted mt-1">ativos agora · sai em ~30s ao fechar</p>
        </div>

        {/* Visitantes: total (cumulativo) + janelas móveis */}
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="text-xs dash-muted flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Visitantes</p>
            <p className="text-[11px] dash-muted">desde o lançamento</p>
          </div>
          <p className="font-serif text-4xl font-bold dash-title leading-none">{s.visitorsTotal.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] dash-muted mt-1 mb-3">total acumulado · só cresce</p>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 dark:border-white/[0.06] pt-3">
            {[
              { k: "Hoje", v: s.visitorsToday },
              { k: "7 dias", v: s.visitors7d },
              { k: "30 dias", v: s.visitors30d },
            ].map(x => (
              <div key={x.k}>
                <p className="font-serif text-xl font-bold dash-title leading-none">{x.v.toLocaleString("pt-BR")}</p>
                <p className="text-[11px] dash-muted mt-1">{x.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs de negócio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <Link key={c.label} href={c.href}
            className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-200 dark:hover:border-white/[0.12] transition-colors">
            <c.icon className={`w-4 h-4 ${c.color} mb-2`} />
            <p className="font-serif text-2xl font-bold dash-title leading-none">{c.value}</p>
            <p className="text-[11px] dash-muted mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Engajamento do site (negócios) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
          <Eye className="w-4 h-4 text-blue-500 mb-2" />
          <p className="font-serif text-2xl font-bold dash-title leading-none">{s.views7d.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] dash-muted mt-1">Visualizações de perfis (7d)</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
          <MessageCircle className="w-4 h-4 text-emerald-500 mb-2" />
          <p className="font-serif text-2xl font-bold dash-title leading-none">{s.clicks7d.toLocaleString("pt-BR")}</p>
          <p className="text-[11px] dash-muted mt-1">Cliques no WhatsApp (7d)</p>
        </div>
      </div>

      {/* Ações pendentes */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold dash-title">Aguardando você</h2>
          {totalPending === 0 && <span className="text-xs dash-muted">— tudo em dia ✨</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pending.map(p => (
            <Link key={p.label} href={p.href}
              className={`rounded-xl border p-3 text-center transition-colors ${p.value > 0 ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/[0.06] hover:bg-amber-100/60" : "border-gray-100 dark:border-white/[0.07] hover:bg-gray-50 dark:hover:bg-white/5"}`}>
              <p className={`text-2xl font-bold ${p.value > 0 ? "text-amber-600 dark:text-amber-400" : "dash-muted"}`}>{p.value}</p>
              <p className="text-[11px] dash-muted mt-0.5">{p.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
