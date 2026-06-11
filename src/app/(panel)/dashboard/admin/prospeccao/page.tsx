import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { ProspectList, type Prospect, type Cadence } from "./_components/prospect-list"
import { buildProspectMessage, buildFollowup3Message, buildFollowup7Message } from "@/lib/prospect-message"
import type { Prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface SearchProps {
  searchParams: Promise<{ q?: string; cat?: string; nota?: string; status?: string }>
}

function waUrl(phoneOrWa: string | null, pitch: string): string | null {
  if (!phoneOrWa) return null
  let digits = phoneOrWa.replace(/\D/g, "")
  if (digits.length < 10) return null
  if (!digits.startsWith("55")) digits = "55" + digits
  return `https://wa.me/${digits}?text=${encodeURIComponent(pitch)}`
}

export default async function ProspeccaoPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, cat, nota, status } = await searchParams

  // Base de URL: usa o host atual (em produção = domínio/vercel; assim os links funcionam)
  const h = await headers()
  const host = h.get("host") ?? "acheinojardimbotanico.vercel.app"
  const base = `${host.includes("localhost") ? "http" : "https"}://${host}`

  const where: Prisma.BusinessWhereInput = {
    status: { in: ["IMPORTED", "CLAIMED"] },
    ...(q ? { name: { contains: q } } : {}),
    ...(cat ? { category: { slug: cat } } : {}),
    ...(nota ? { googleRating: { gte: parseFloat(nota) } } : {}),
  }

  const [businesses, categories, touchLogs] = await Promise.all([
    db.business.findMany({
      where,
      select: { id: true, name: true, neighborhood: true, slug: true, phone: true, whatsapp: true, googleRating: true, googleRatingCount: true, category: { select: { name: true, slug: true } } },
      orderBy: [{ googleRatingCount: "desc" }],
      take: 80,
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.auditLog.findMany({
      where: { action: { in: ["prospect.contacted", "prospect.followup3", "prospect.followup7"] } },
      select: { entityId: true, action: true, createdAt: true },
    }),
  ])

  // Último toque de cada tipo por negócio (D0 / D+3 / D+7)
  const touches = new Map<string, { d0?: Date; d3?: Date; d7?: Date }>()
  for (const l of touchLogs) {
    const t = touches.get(l.entityId) ?? {}
    const key = l.action === "prospect.contacted" ? "d0" : l.action === "prospect.followup3" ? "d3" : "d7"
    if (!t[key] || l.createdAt > t[key]!) t[key] = l.createdAt
    touches.set(l.entityId, t)
  }

  const daysSince = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000)

  /** Estágio da cadência: D0 → (3d) → D+3 → (4d) → D+7 → frio. */
  function cadenceOf(businessId: string): Cadence {
    const t = touches.get(businessId)
    if (!t?.d0) return { next: "d0", due: false, label: "Novo — D0 pronto" }
    if (t.d7) return { next: null, due: false, label: `Ciclo completo há ${daysSince(t.d7)}d` }
    if (t.d3) {
      const d = daysSince(t.d3)
      return d >= 4
        ? { next: "d7", due: true, label: "D+7 — última mensagem" }
        : { next: "d7", due: false, label: `D+7 em ${4 - d}d` }
    }
    const d = daysSince(t.d0)
    return d >= 3
      ? { next: "d3", due: true, label: `D+3 vencido (contato há ${d}d)` }
      : { next: "d3", due: false, label: `D+3 em ${3 - d}d` }
  }

  let items: Prospect[] = businesses.map(b => {
    const link = `${base}/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
    const cadence = cadenceOf(b.id)
    // A mensagem acompanha o estágio: D0 (apresentação) → D+3 (prova) → D+7 (escassez)
    const pitch =
      cadence.next === "d3" ? buildFollowup3Message({ name: b.name, link })
      : cadence.next === "d7" ? buildFollowup7Message({ name: b.name, categoryName: b.category.name })
      : buildProspectMessage({
          name: b.name, link, rating: b.googleRating, ratingCount: b.googleRatingCount,
          categorySlug: b.category.slug, categoryName: b.category.name,
        })
    return {
      id: b.id, name: b.name, category: b.category.name, neighborhood: b.neighborhood,
      rating: b.googleRating, ratingCount: b.googleRatingCount, phone: b.whatsapp ?? b.phone,
      profileUrl: link, waUrl: waUrl(b.whatsapp ?? b.phone, pitch), pitch,
      contacted: !!touches.get(b.id)?.d0, cadence,
    }
  })

  if (status === "pendente") items = items.filter(i => !i.contacted)
  if (status === "contatado") items = items.filter(i => i.contacted)
  if (status === "followup") items = items.filter(i => i.cadence.due)

  const dueCount = items.filter(i => i.cadence.due).length

  const inputCls = "px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Prospecção 🎯</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Escolha um negócio → abre o WhatsApp com a mensagem pronta → você só envia.</p>
      </div>

      <form className="flex gap-2 flex-wrap items-center">
        <input name="q" defaultValue={q} placeholder="Buscar por nome..." className={inputCls + " flex-1 min-w-40"} />
        <select name="cat" defaultValue={cat ?? ""} className={inputCls + " bg-white dark:bg-[#111]"}>
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="nota" defaultValue={nota ?? ""} className={inputCls + " bg-white dark:bg-[#111]"}>
          <option value="">Nota mínima</option>
          <option value="4.5">4,5+</option>
          <option value="4">4,0+</option>
          <option value="3.5">3,5+</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className={inputCls + " bg-white dark:bg-[#111]"}>
          <option value="">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="contatado">Contatados</option>
          <option value="followup">Follow-up vencido</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">Filtrar</button>
        {(q || cat || nota || status) && (
          <Link href="/dashboard/admin/prospeccao" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Limpar</Link>
        )}
      </form>

      <p className="text-xs dash-muted">
        {items.length} negócio{items.length === 1 ? "" : "s"} (máx. 80 por busca · refine com os filtros). Abrir o WhatsApp registra o toque da cadência (D0 → D+3 → D+7).
        {dueCount > 0 && <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">⚡ {dueCount} follow-up{dueCount > 1 ? "s" : ""} vencido{dueCount > 1 ? "s" : ""} — comece por eles!</span>}
      </p>

      <ProspectList items={items} />
    </div>
  )
}
