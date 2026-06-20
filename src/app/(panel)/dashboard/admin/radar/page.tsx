import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { healthScore, type HealthState } from "@/lib/health-score"
import { buildGhostMessage } from "@/lib/prospect-message"
import type { Prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface SearchProps {
  searchParams: Promise<{ nivel?: string; cat?: string }>
}

function waUrl(phoneOrWa: string | null, pitch: string): string | null {
  if (!phoneOrWa) return null
  let d = phoneOrWa.replace(/\D/g, "")
  if (d.length < 10) return null
  if (!d.startsWith("55")) d = "55" + d
  return `https://wa.me/${d}?text=${encodeURIComponent(pitch)}`
}

const TONE: Record<HealthState, { ring: string; text: string; chip: string; label: string }> = {
  morto:    { ring: "border-red-300 dark:border-red-500/40",     text: "text-red-600 dark:text-red-400",       chip: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",          label: "Morto" },
  fraco:    { ring: "border-amber-300 dark:border-amber-500/40", text: "text-amber-600 dark:text-amber-400",   chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",  label: "Fraco" },
  saudavel: { ring: "border-emerald-300 dark:border-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", label: "Saudável" },
}

export default async function RadarPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { nivel, cat } = await searchParams

  const h = await headers()
  const host = h.get("host") ?? "acheinojardimbotanico.com.br"
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`

  const where: Prisma.BusinessWhereInput = {
    status: { in: ["IMPORTED", "CLAIMED"] },
    ...(cat ? { category: { slug: cat } } : {}),
  }

  const [rows, categories] = await Promise.all([
    db.business.findMany({
      where,
      select: {
        id: true, name: true, neighborhood: true, slug: true,
        phone: true, whatsapp: true, website: true, instagram: true,
        description: true, openingHours: true, googleRatingCount: true,
        plan: true, ownerId: true,
        category: { select: { name: true, slug: true } },
        _count: { select: { photos: true } },
      },
      take: 1000,
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ])

  const scored = rows.map((b) => {
    const health = healthScore({
      phone: b.phone, whatsapp: b.whatsapp, website: b.website, instagram: b.instagram,
      description: b.description, openingHours: b.openingHours,
      googleRatingCount: b.googleRatingCount, photoCount: b._count.photos,
    })
    const link = `${base}/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
    const wa = waUrl(b.whatsapp ?? b.phone, buildGhostMessage({ name: b.name, link, missing: health.missing }))
    const tag = b.plan !== "FREE" ? "Cliente" : b.ownerId ? "Reivindicado" : "Livre"
    return { id: b.id, name: b.name, category: b.category.name, neighborhood: b.neighborhood, reviews: b.googleRatingCount ?? 0, link, wa, tag, health }
  })

  const counts = {
    total: scored.length,
    morto: scored.filter((s) => s.health.state === "morto").length,
    fraco: scored.filter((s) => s.health.state === "fraco").length,
    saudavel: scored.filter((s) => s.health.state === "saudavel").length,
    hot: scored.filter((s) => s.health.hot).length,
    livres: scored.filter((s) => s.tag === "Livre").length,
  }

  let list = scored
  if (nivel === "morto" || nivel === "fraco" || nivel === "saudavel") list = list.filter((s) => s.health.state === nivel)
  else if (nivel === "hot") list = list.filter((s) => s.health.hot)
  // 🔥 primeiro, depois pior saúde no topo
  list = [...list].sort((a, b) => Number(b.health.hot) - Number(a.health.hot) || a.health.score - b.health.score)
  const shown = list.slice(0, 60)

  const filterCls = "px-3 py-1.5 text-xs rounded-full border transition-colors"
  const chip = (active: boolean) => active
    ? "bg-emerald-600 text-white border-emerald-600"
    : "border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"
  const qs = (n?: string) => `?${new URLSearchParams({ ...(n ? { nivel: n } : {}), ...(cat ? { cat } : {}) }).toString()}`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title flex items-center gap-2">👻 Radar Fantasma</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Perfis abandonados no Google = lista de prospecção. Score de saúde calculado do que já importamos (0 = morto, 100 = completo).</p>
      </div>

      {/* Contadores — o pé no chão: quantos estão realmente vivos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { k: "Total", v: counts.total, tone: "dash-title" },
          { k: "🔴 Mortos", v: counts.morto, tone: "text-red-600 dark:text-red-400" },
          { k: "🟡 Fracos", v: counts.fraco, tone: "text-amber-600 dark:text-amber-400" },
          { k: "🟢 Saudáveis", v: counts.saudavel, tone: "text-emerald-600 dark:text-emerald-400" },
          { k: "🔥 Bons leads", v: counts.hot, tone: "text-orange-600 dark:text-orange-400" },
          { k: "Livres", v: counts.livres, tone: "dash-title" },
        ].map((c) => (
          <div key={c.k} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] p-3">
            <p className={`text-2xl font-bold ${c.tone}`}>{c.v}</p>
            <p className="text-xs dash-subtitle mt-0.5">{c.k}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        {[["", "Todos"], ["hot", "🔥 Bons leads"], ["morto", "🔴 Mortos"], ["fraco", "🟡 Fracos"], ["saudavel", "🟢 Saudáveis"]].map(([v, label]) => (
          <Link key={v} href={`/dashboard/admin/radar${qs(v || undefined)}`} className={`${filterCls} ${chip((nivel ?? "") === v)}`}>{label}</Link>
        ))}
        <form className="ml-auto">
          {nivel && <input type="hidden" name="nivel" value={nivel} />}
          <select name="cat" defaultValue={cat ?? ""} className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] dash-title focus:outline-none">
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </form>
      </div>

      <p className="text-xs dash-muted">Mostrando {shown.length} de {list.length} (piores primeiro). Custo Google: zero — é só leitura do que já temos.</p>

      {/* Lista */}
      <div className="space-y-2.5">
        {shown.map((s) => {
          const t = TONE[s.health.state]
          return (
            <div key={s.id} className={`rounded-2xl border ${t.ring} p-3.5 flex items-start gap-3.5`}>
              {/* Score */}
              <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
                <span className={`text-2xl font-bold leading-none ${t.text}`}>{s.health.score}</span>
                <span className="text-[10px] dash-subtitle mt-0.5">/100</span>
              </div>

              {/* Conteúdo */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold dash-title text-sm truncate">{s.name}</span>
                  {s.health.hot && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">🔥 popular e largado</span>}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.chip}`}>{t.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10 dash-subtitle">{s.tag}</span>
                </div>
                <p className="text-xs dash-subtitle mt-0.5 truncate">{s.category} · {s.neighborhood} · {s.reviews} avaliações</p>
                {s.health.missing.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {s.health.missing.map((m) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] dash-subtitle">{m}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {s.wa ? (
                  <a href={s.wa} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-colors whitespace-nowrap">WhatsApp</a>
                ) : (
                  <span className="text-[11px] px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] dash-subtitle text-center whitespace-nowrap" title="Sem telefone no perfil — visite o local">sem contato → visitar</span>
                )}
                <Link href={s.link} target="_blank" className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 text-center transition-colors whitespace-nowrap">Ver perfil</Link>
              </div>
            </div>
          )
        })}
        {shown.length === 0 && <p className="text-sm dash-subtitle py-8 text-center">Nenhum negócio neste filtro.</p>}
      </div>
    </div>
  )
}
