import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { slugify, SITE_URL } from "@/lib/utils"
import { ProductShowcase } from "../_components/product-showcase"
import { ArrowLeft, Star, MapPin, Crown, ShoppingBag } from "lucide-react"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string; categoria: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await db.business.findUnique({ where: { slug }, select: { name: true } })
  if (!business) return {}
  return {
    title: `Loja de ${business.name}`,
    description: `Produtos de ${business.name} — compre pelo WhatsApp, no Achei no Jardim Botânico.`,
  }
}

export default async function StorePage({ params }: PageProps) {
  const { bairro, categoria, slug } = await params

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      category: true,
      photos: { orderBy: { order: "asc" }, take: 1 },
      products: { where: { active: true }, orderBy: { order: "asc" } },
    },
  })

  if (!business || business.status === "SUSPENDED") notFound()

  const products = business.products.map(p => ({
    id: p.id, name: p.name, description: p.description, categoria: p.categoria,
    priceMode: p.priceMode as "FIXED" | "FROM" | "ON_REQUEST", priceCents: p.priceCents, promoPriceCents: p.promoPriceCents,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    variations: Array.isArray(p.variations) ? (p.variations as unknown as { nome: string; opcoes: string[] }[]) : [],
    soldOut: p.soldOut,
  }))

  const profileUrl = `/${bairro}/${categoria}/${slug}`
  const businessUrl = `${SITE_URL}/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}/loja`
  const isPremium = business.plan === "PREMIUM"
  const cover = business.photos[0]?.url

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Voltar */}
      <Link href={profileUrl} className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Voltar ao perfil
      </Link>

      {/* Cabeçalho da loja */}
      <div className="relative rounded-3xl overflow-hidden flora-hero mb-8">
        {cover && (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        <div className="relative p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-flora-gold" />
            <span className="text-xs uppercase tracking-widest text-white/70">Loja</span>
            {isPremium && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink uppercase tracking-wide">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight">{business.name}</h1>
          <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-white/75">
            <span>{business.category.name}</span>
            {business.googleRating && (
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-flora-gold text-flora-gold" />{business.googleRating.toFixed(1)}</span>
            )}
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{business.neighborhood}</span>
            <span>· {products.length} {products.length === 1 ? "produto" : "produtos"}</span>
          </div>
        </div>
      </div>

      {/* Produtos */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-flora-green/30 mx-auto mb-3" />
          <p className="font-serif text-xl flora-ink">Esta loja ainda não tem produtos</p>
        </div>
      ) : (
        <ProductShowcase
          products={products}
          businessId={business.id}
          whatsapp={business.whatsapp}
          storeMessage={business.storeWhatsappMessage}
          businessUrl={businessUrl}
        />
      )}
    </main>
  )
}
