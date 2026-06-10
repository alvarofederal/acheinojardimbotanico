/**
 * scripts/lista-prospeccao.ts
 * SOMENTE LEITURA. Gera a lista priorizada de alvos de venda do JBT:
 * negócios NÃO reivindicados, com WhatsApp, ordenados por views (30d),
 * diversificados por categoria (máx. 3 por categoria).
 *
 * Roda contra o PROD (dados reais de audiência):
 *   npx tsx scripts/lista-prospeccao.ts          ← usa SRC_DATABASE_URL (prod) se existir
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma"

const url = process.env.SRC_DATABASE_URL || process.env.DATABASE_URL
const db = new PrismaClient({ datasources: { db: { url } } })

const MAX_POR_CATEGORIA = 3
const TOTAL = 45 // 3 semanas × 15 alvos

async function main() {
  const masked = (url ?? "").replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@")
  console.log(`-- Fonte (leitura): ${masked}\n`)

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [views, clicks, businesses] = await Promise.all([
    db.businessView.groupBy({
      by: ["businessId"],
      where: { date: { gte: since } },
      _sum: { count: true },
    }),
    db.whatsappClick.groupBy({
      by: ["businessId"],
      where: { date: { gte: since } },
      _sum: { count: true },
    }),
    db.business.findMany({
      where: {
        ownerId: null, status: { not: "SUSPENDED" },
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: {
        id: true, name: true, whatsapp: true, phone: true, neighborhood: true, slug: true, handle: true,
        googleRating: true, googleRatingCount: true,
        category: { select: { name: true, slug: true } },
      },
    }),
  ])

  const v = new Map(views.map(x => [x.businessId, x._sum.count ?? 0]))
  const c = new Map(clicks.map(x => [x.businessId, x._sum.count ?? 0]))

  const ranked = businesses
    .map(b => ({ ...b, views30: v.get(b.id) ?? 0, clicks30: c.get(b.id) ?? 0 }))
    .sort((a, b) => (b.views30 - a.views30) || (b.clicks30 - a.clicks30) || ((b.googleRatingCount ?? 0) - (a.googleRatingCount ?? 0)))

  const porCategoria = new Map<string, number>()
  const lista: typeof ranked = []
  for (const b of ranked) {
    const n = porCategoria.get(b.category.slug) ?? 0
    if (n >= MAX_POR_CATEGORIA) continue
    porCategoria.set(b.category.slug, n + 1)
    lista.push(b)
    if (lista.length >= TOTAL) break
  }

  // celular (provável WhatsApp): 9 no início do número local
  const cel = (s: string | null) => !!s && /9\d{4}[- ]?\d{4}\s*$/.test(s.replace(/\D/g, " ").trim())

  console.log(`| # | Negócio | Categoria | Bairro | Contato | Views 30d | Zap 30d | Google |`)
  console.log(`|---|---------|-----------|--------|---------|-----------|---------|--------|`)
  lista.forEach((b, i) => {
    const contato = b.whatsapp ? `${b.whatsapp} (zap ✓)` : `${b.phone}${cel(b.phone) ? " (cel)" : " (fixo)"}`
    console.log(`| ${i + 1} | ${b.name} | ${b.category.name} | ${b.neighborhood} | ${contato} | ${b.views30} | ${b.clicks30} | ${b.googleRating ?? "—"} (${b.googleRatingCount ?? 0}) |`)
  })

  console.log(`\n-- Total no funil: ${lista.length} alvos (de ${businesses.length} elegíveis: sem dono + com contato)`)
}

main().finally(() => db.$disconnect())
