import type { MetadataRoute } from "next"
import { db } from "@/lib/prisma"
import { slugify, SITE_URL } from "@/lib/utils"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  ]

  // Páginas estáticas relevantes para SEO
  for (const path of ["anuncie", "promocoes", "noticias", "eventos"]) {
    entries.push({ url: `${SITE_URL}/${path}`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 })
  }

  // Negócios visíveis
  const businesses = await db.business.findMany({
    where: { status: { in: ["IMPORTED", "CLAIMED"] } },
    select: { slug: true, neighborhood: true, updatedAt: true, category: { select: { slug: true } } },
    take: 5000,
  })

  // Páginas de categoria por bairro (deduplicadas)
  const categoryPages = new Set<string>()

  for (const b of businesses) {
    const bairro = slugify(b.neighborhood)
    categoryPages.add(`${bairro}/${b.category.slug}`)
    entries.push({
      url: `${SITE_URL}/${bairro}/${b.category.slug}/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  }

  for (const page of categoryPages) {
    entries.push({
      url: `${SITE_URL}/${page}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })
  }

  // Notícias publicadas
  const news = await db.news.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    take: 2000,
  })
  for (const n of news) {
    entries.push({ url: `${SITE_URL}/noticias/${n.slug}`, lastModified: n.updatedAt, changeFrequency: "monthly", priority: 0.6 })
  }

  // Eventos publicados
  const events = await db.event.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    take: 2000,
  })
  for (const e of events) {
    entries.push({ url: `${SITE_URL}/eventos/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "weekly", priority: 0.6 })
  }

  return entries
}
