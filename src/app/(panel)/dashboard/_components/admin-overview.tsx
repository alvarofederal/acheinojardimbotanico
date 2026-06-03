import Link from "next/link"
import { Radio, Users, CreditCard, ShieldCheck, Building2, Eye, MessageCircle, Clock, TrendingUp } from "lucide-react"

export interface AdminStats {
  online: number
  visitorsTotal: number
  visitorsToday: number
  visitors7d: number
  visitors30d: number
  totalBusinesses: number
  claimed: number
  paying: number
  pendingReview: number
  pendingClaims: number
  pendingPayments: number
  pendingEvents: number
  views7d: number
  clicks7d: number
  mrrCents: number
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
