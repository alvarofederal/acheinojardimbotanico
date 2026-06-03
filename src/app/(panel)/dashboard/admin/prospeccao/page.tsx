import { redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { ProspectList, type Prospect } from "./_components/prospect-list"
import { buildProspectMessage } from "@/lib/prospect-message"
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

  const [businesses, categories, contactedLogs] = await Promise.all([
    db.business.findMany({
      where,
      select: { id: true, name: true, neighborhood: true, slug: true, phone: true, whatsapp: true, googleRating: true, googleRatingCount: true, category: { select: { name: true, slug: true } } },
      orderBy: [{ googleRatingCount: "desc" }],
      take: 80,
    }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.auditLog.findMany({ where: { action: "prospect.contacted" }, select: { entityId: true } }),
  ])

  const contactedSet = new Set(contactedLogs.map(l => l.entityId))

  let items: Prospect[] = businesses.map(b => {
    const link = `${base}/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
    const pitch = buildProspectMessage({
      name: b.name, link, rating: b.googleRating, ratingCount: b.googleRatingCount,
      categorySlug: b.category.slug, categoryName: b.category.name,
    })
    return {
      id: b.id, name: b.name, category: b.category.name, neighborhood: b.neighborhood,
      rating: b.googleRating, ratingCount: b.googleRatingCount, phone: b.whatsapp ?? b.phone,
      profileUrl: link, waUrl: waUrl(b.whatsapp ?? b.phone, pitch), pitch,
      contacted: contactedSet.has(b.id),
    }
  })

  if (status === "pendente") items = items.filter(i => !i.contacted)
  if (status === "contatado") items = items.filter(i => i.contacted)

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
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">Filtrar</button>
        {(q || cat || nota || status) && (
          <Link href="/dashboard/admin/prospeccao" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Limpar</Link>
        )}
      </form>

      <p className="text-xs dash-muted">{items.length} negócio{items.length === 1 ? "" : "s"} (máx. 80 por busca · refine com os filtros). Abrir o WhatsApp já marca como contatado.</p>

      <ProspectList items={items} />
    </div>
  )
}
