import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { getMenuVisibility } from "@/lib/site-visibility"
import { SITE_URL } from "@/lib/utils"
import { lojaPath } from "@/lib/links"
import { getPlanConfigs } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { PromoGrid, type PromoItem } from "./_components/promo-grid"
import { Tag } from "lucide-react"

export const revalidate = 1800

export const metadata: Metadata = {
  title: "Promoções no Jardim Botânico",
  description: "Ofertas e promoções dos negócios do Jardim Botânico (DF). Economize comprando perto de casa.",
}

export default async function PromocoesPage() {
  if (!(await getMenuVisibility()).promocoes) notFound()
  const products = await db.product.findMany({
    where: {
      active: true,
      soldOut: false,
      promoPriceCents: { not: null },
      business: { status: { in: ["IMPORTED", "CLAIMED"] } },
    },
    include: {
      business: { select: { id: true, name: true, slug: true, handle: true, plan: true, neighborhood: true, whatsapp: true, storeWhatsappMessage: true, category: { select: { slug: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

  // Só mostra ofertas de negócios cujo plano libera "Promoções"
  const cfgs = await getPlanConfigs()
  const promoProducts = products.filter(p => cfgs[p.business.plan as PlanId]?.features.promocoes)

  const items: PromoItem[] = promoProducts.map(p => {
    const storeHref = lojaPath(p.business)
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      promoPriceCents: p.promoPriceCents!,
      image: Array.isArray(p.images) && p.images.length ? (p.images as unknown as string[])[0] : null,
      businessId: p.business.id,
      businessName: p.business.name,
      whatsapp: p.business.whatsapp,
      storeMessage: p.business.storeWhatsappMessage,
      storeUrl: `${SITE_URL}${storeHref}`,
      storeHref,
    }
  })

  const categories = [...new Set(promoProducts.map(p => p.business.category.slug))].slice(0, 12)

  return (
    <main>
      {/* Hero */}
      <section className="relative flora-hero overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/15 mb-5">
            <Tag className="w-3 h-3" /> Ofertas do bairro
          </span>
          <h1 className="font-serif font-semibold text-white leading-tight" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
            Promoções no <span className="italic text-flora-gold">Jardim Botânico</span>
          </h1>
          <p className="mt-4 text-white/75 max-w-lg mx-auto">As melhores ofertas dos negócios da região, num só lugar.</p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: "48px" }}>
          <path d="M0,45 C240,90 480,10 720,35 C960,60 1200,20 1440,40 L1440,90 L0,90 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-flora-green/30 mx-auto mb-4" />
            <p className="font-serif text-xl flora-ink mb-1">Nenhuma oferta ativa no momento</p>
            <p className="text-sm flora-muted">Volte em breve — os lojistas estão preparando novidades. 🌿</p>
          </div>
        ) : (
          <PromoGrid items={items} categories={categories} />
        )}
      </section>
    </main>
  )
}
