import { cache } from "react"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { lojaPath, profileUrl } from "@/lib/links"
import { getPlanConfig } from "@/lib/plan-config"
import { getMenuVisibility } from "@/lib/site-visibility"
import { weekRows } from "@/lib/opening-hours"
import { OpenStatusPill, OpenStatusFact } from "./open-status"
import { type PlanId } from "@/lib/plans"
import Link from "next/link"
import { MapPin, Phone, Globe, Instagram, Facebook, Linkedin, Youtube, Star, Clock, Navigation, Store, Briefcase, ArrowLeft, BadgeCheck, Sparkles, Images, ShoppingBag, MapPinned, Megaphone } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"
import { TrackView } from "./track-view"
import { TrackLink } from "./track-link"
import { WhatsAppButton } from "./whatsapp-button"
import { ClaimBanner } from "./claim-banner"
import { ProductShowcase } from "./product-showcase"
import { PhotoGallery } from "./photo-gallery"
import { BusinessMap } from "./business-map"
import { FloatingWhatsApp } from "../loja/_components/floating-whatsapp"

/**
 * Carrega o negócio do perfil (por slug OU handle). Em React cache pra não
 * duplicar a query entre generateMetadata e a página.
 */
export const loadProfile = cache(async (where: { slug: string } | { handle: string }) => {
  return db.business.findUnique({
    where,
    include: {
      category: true,
      photos: { orderBy: { order: "asc" }, take: 10 },
      products: { where: { active: true }, orderBy: { order: "asc" } },
      vagas: { where: { active: true }, select: { id: true }, take: 1 },
    },
  })
})

export type ProfileBusiness = NonNullable<Awaited<ReturnType<typeof loadProfile>>>

/** Metadados do perfil — canonical SEMPRE na URL curta (handle). */
export function buildProfileMetadata(business: ProfileBusiness): Metadata {
  const canonical = profileUrl(business)
  return {
    title: `${business.name} — ${business.category.name} em ${business.neighborhood}`,
    description: business.description ?? `${business.name} — ${business.category.name} no ${business.neighborhood}, ${business.city}. Endereço, telefone e horários de funcionamento.`,
    alternates: { canonical },
    openGraph: { title: business.name, description: business.description ?? undefined, type: "website", url: canonical },
  }
}

interface PlaceReview {
  rating?: number
  text?: { text: string }
  relativePublishTimeDescription?: string
  authorAttribution?: { displayName?: string; photoUri?: string }
}

function getReviews(reviews: unknown): PlaceReview[] {
  if (!Array.isArray(reviews)) return []
  return (reviews as PlaceReview[]).filter(r => r?.text?.text).slice(0, 3)
}

function getWeekdayDescriptions(openingHours: unknown): string[] {
  try {
    const h = openingHours as { weekdayDescriptions?: string[] }
    return h?.weekdayDescriptions ?? []
  } catch { return [] }
}

/** Texto de urgência do prazo da oferta, no fuso de Brasília. */
function offerUrgency(deadline: Date): string {
  const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
  const days = Math.round((Date.parse(ymd(deadline)) - Date.parse(ymd(new Date()))) / 86400000)
  if (days <= 0) return "Termina hoje!"
  if (days === 1) return "Termina amanhã"
  if (days <= 6) return "Termina " + new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(deadline)
  return "Válida até " + new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(deadline)
}

/**
 * Perfil público do negócio — renderizado IN-PLACE tanto na URL curta /{handle}
 * quanto (como fallback, sem handle) na longa. Todos os links agregados (loja,
 * voltar, compartilhar) são derivados do próprio negócio via @/lib/links.
 */
export async function ProfileView({ business }: { business: ProfileBusiness }) {
  const reviews = getReviews(business.reviews)
  // O status "aberto agora" é calculado AO VIVO no client (OpenStatusPill/Fact),
  // pra bater 100% com o card e nunca congelar com o ISR. Aqui no servidor montamos
  // só o quadro estático da semana: prioriza os horários do lojista (periods); se
  // não houver, cai no texto importado do Google (weekdayDescriptions).
  const ownWeek = weekRows(business.openingHours)
  const hasOwnHours = ownWeek.some(r => r.text !== "Fechado")
  const googleWeekdays = getWeekdayDescriptions(business.openingHours)
  const weekTable = hasOwnHours
    ? ownWeek.map(r => ({ label: r.day, text: r.text }))
    : googleWeekdays.map(s => { const ci = s.indexOf(":"); return { label: ci > 0 ? s.slice(0, ci) : s, text: ci > 0 ? s.slice(ci + 1).trim() : "" } })
  const hasHours = weekTable.length > 0
  const todayIdx = Math.max(0, ownWeek.findIndex(r => r.today)) // 0 = seg … 6 = dom (fuso de Brasília, via weekRows)

  // Recursos liberados pelo plano do negócio
  const planCfg = await getPlanConfig(business.plan as PlanId)
  const feat = planCfg.features
  // Botão "Vagas" no perfil: Vagas visível no site + reivindicado, em plano com vagas e com ≥1 vaga ativa.
  const menuVis = await getMenuVisibility()
  const hasVagas = menuVis.vagas && !!business.ownerId && feat.vagas && business.vagas.length > 0

  const showcaseProducts = business.products.map(p => ({
    id: p.id, name: p.name, description: p.description, categoria: p.categoria,
    priceMode: p.priceMode as "FIXED" | "FROM" | "ON_REQUEST", priceCents: p.priceCents,
    promoPriceCents: feat.promocoes ? p.promoPriceCents : null,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    variations: Array.isArray(p.variations) ? (p.variations as unknown as { nome: string; opcoes: string[] }[]) : [],
    soldOut: p.soldOut,
  }))

  // Links derivados do negócio (curtos quando há handle)
  const listingHref = `/${slugify(business.neighborhood)}/${business.category.slug}`
  const storeHref = lojaPath(business)
  const businessUrl = profileUrl(business)

  // Oferta em destaque (perk Premium): ativa, com título e dentro do prazo
  const offerLive = feat.oferta && business.offerActive && !!business.offerTitle &&
    (!business.offerDeadline || business.offerDeadline.getTime() >= Date.now())
  const offerUrg = offerLive && business.offerDeadline ? offerUrgency(business.offerDeadline) : null
  const offerWa = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Tenho interesse na oferta: ${business.offerTitle}`)}`
    : null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    address: { "@type": "PostalAddress", streetAddress: business.address, addressLocality: business.city, addressRegion: business.state, addressCountry: "BR" },
    geo: { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude },
    telephone: business.phone ?? undefined,
    url: businessUrl,
    aggregateRating: business.googleRating ? { "@type": "AggregateRating", ratingValue: business.googleRating, reviewCount: business.googleRatingCount ?? 1 } : undefined,
  }

  const destinationText = encodeURIComponent(`${business.name}, ${business.address}`)
  const mapsUrl = business.placeId
    ? `https://www.google.com/maps/dir/?api=1&destination=${destinationText}&destination_place_id=${business.placeId}`
    : `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`

  const cover = business.storeCoverUrl ?? business.photos[0]?.url ?? null
  const coverPos = business.storeCoverPos || "50% 50%"
  const logo = business.logoUrl ?? business.photos[0]?.url ?? null
  const rating = business.googleRating ?? 0
  const ghostBtn = "flex items-center gap-2 px-4 py-3 rounded-2xl bg-flora-green/[0.07] hover:bg-flora-green/[0.13] text-flora-ink dark:text-white text-sm font-semibold transition-all hover:-translate-y-0.5"

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: "@keyframes kbns{from{transform:scale(1.06)}to{transform:scale(1.16) translateY(-10px)}}" }} />
      <TrackView businessId={business.id} />

      {/* ── HERO cinematográfico ──────────────────────────────────── */}
      <header className="relative min-h-[72vh] flex flex-col justify-end overflow-hidden isolate">
        {cover ? (
          <div className="absolute inset-0 -z-30 bg-cover" style={{ backgroundImage: `url('${cover}')`, backgroundPosition: coverPos, animation: "kbns 22s ease-out forwards" }} />
        ) : (
          <div className="absolute inset-0 -z-30" style={{ background: "radial-gradient(125% 95% at 50% -10%,#1e5c45,#123f2f 46%,#0a2b20)" }} />
        )}
        <div className="absolute inset-0 -z-20" style={{ background: "linear-gradient(180deg,rgba(10,43,32,.45) 0%,rgba(10,43,32,.12) 30%,rgba(10,43,32,.6) 70%,rgba(10,43,32,.93) 100%)" }} />

        {/* Voltar p/ a listagem */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 pt-4">
          <div className="max-w-3xl mx-auto">
            <Link href={listingHref}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-white/85 bg-black/20 backdrop-blur-sm border border-white/15 px-3.5 py-2 rounded-full hover:bg-black/30 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {business.category.name} em {business.neighborhood}
            </Link>
          </div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 pb-9 sm:pb-12">
          <div className="max-w-3xl mx-auto">
            {logo && (
              <img src={logo} alt={business.name} loading="eager"
                className="w-[76px] h-[76px] rounded-2xl object-cover border-[3px] border-white/90 shadow-2xl mb-4" />
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-flora-gold text-flora-ink">{business.category.name}</span>
              <OpenStatusPill openingHours={business.openingHours} />
              {feat.selo && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1d9bf0] text-white shadow-sm">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              )}
            </div>
            <h1 className="font-serif font-bold text-white leading-[1.02] tracking-tight mt-3 mb-2.5 flora-rise"
              style={{ fontSize: "clamp(2.4rem,6.5vw,4.4rem)", textShadow: "0 4px 30px rgba(0,0,0,.4)" }}>
              {business.name}
            </h1>
            <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-white/90 text-sm">
              {business.googleRating && (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? "fill-flora-gold text-flora-gold" : "text-white/30"}`} />
                    ))}
                  </span>
                  <b className="text-base">{rating.toFixed(1)}</b>
                  {business.googleRatingCount && <span className="text-white/60">· {business.googleRatingCount} avaliações no Google</span>}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-white/80"><MapPin className="w-4 h-4" /> {business.neighborhood} · {business.city}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Barra de ações (vidro, sobrepondo o herói) ─────────────── */}
      <div className="relative z-20 -mt-7 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-flora-deep/70 backdrop-blur-xl shadow-2xl shadow-flora-green/20 p-3 flex flex-wrap gap-2.5">
            {business.whatsapp && (
              <div className="flex-1 min-w-[160px] flex">
                <WhatsAppButton businessId={business.id} whatsapp={business.whatsapp} name={business.name} />
              </div>
            )}
            {business.ifood && (
              <TrackLink businessId={business.id} kind="ifood" href={business.ifood}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#EA1D2C] hover:brightness-110 text-white text-sm font-semibold transition-all hover:-translate-y-0.5">
                <ShoppingBag className="w-4 h-4" /> Pedir no iFood
              </TrackLink>
            )}
            {feat.loja && (
              <Link href={storeHref}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-flora-gold hover:brightness-105 text-flora-ink text-sm font-semibold transition-all hover:-translate-y-0.5">
                <Store className="w-4 h-4" /> Ver loja
              </Link>
            )}
            {hasVagas && (
              <Link href={`/vagas?negocio=${business.slug}`} className={ghostBtn}><Briefcase className="w-4 h-4 text-flora-green" /> Vagas</Link>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={ghostBtn}><Navigation className="w-4 h-4 text-flora-green" /> Como chegar</a>
            {business.phone && <a href={`tel:${business.phone}`} className={ghostBtn}><Phone className="w-4 h-4 text-flora-green" /> Ligar</a>}
            {business.website && <a href={business.website} target="_blank" rel="noopener noreferrer" className={ghostBtn}><Globe className="w-4 h-4 text-flora-green" /> Site</a>}
            {feat.redesSociais && business.instagram && (
              <a href={`https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
                <Instagram className="w-4 h-4 text-[#E1306C]" /> Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">

        {/* ── Oferta em destaque (Premium) ───────────────────────── */}
        {offerLive && (
          <section className="pt-10">
            <div className="relative overflow-hidden rounded-3xl border border-flora-gold/40 bg-gradient-to-br from-flora-gold/25 via-flora-gold/10 to-transparent p-5 sm:p-6 shadow-lg shadow-flora-gold/10">
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-600 text-white shadow-sm">
                  <Megaphone className="w-3.5 h-3.5" /> Oferta
                </span>
                {offerUrg && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-flora-green dark:text-flora-fresh">
                    <Clock className="w-3.5 h-3.5" /> {offerUrg}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink leading-tight">{business.offerTitle}</h2>
              {business.offerText && <p className="text-sm sm:text-base flora-muted mt-2 leading-relaxed">{business.offerText}</p>}
              {offerWa && (
                <TrackLink businessId={business.id} kind="oferta" href={offerWa}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold shadow-lg shadow-flora-green/25 transition-all hover:-translate-y-0.5">
                  <WhatsappIcon className="w-4 h-4" /> Quero esta oferta
                </TrackLink>
              )}
            </div>
          </section>
        )}

        {/* ── Sobre + fatos ──────────────────────────────────────── */}
        {(business.description || business.storeTagline) && (
          <section className="pt-12 sm:pt-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-flora-fresh"><Sparkles className="w-3.5 h-3.5" /> Sobre</span>
            {business.storeTagline && <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-2.5 leading-snug">{business.storeTagline}</h2>}
            {business.description && (
              <p className="font-serif italic text-lg sm:text-xl text-flora-green dark:text-flora-fresh/90 leading-relaxed mt-4 pl-5 border-l-4 border-flora-gold/70">
                “{business.description}”
              </p>
            )}
          </section>
        )}

        {/* Fatos rápidos */}
        <section className="grid sm:grid-cols-2 gap-3 mt-8">
          <div className="flex gap-3.5 items-start flora-card rounded-2xl p-4">
            <span className="w-11 h-11 rounded-xl bg-flora-green/10 text-flora-green flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5" /></span>
            <div><b className="block text-sm flora-ink">{business.address.split(",").slice(0, 2).join(",")}</b><span className="text-xs flora-muted">{business.neighborhood}, {business.city}–{business.state}</span></div>
          </div>
          {hasHours && <OpenStatusFact openingHours={business.openingHours} />}
          {business.phone && (
            <div className="flex gap-3.5 items-start flora-card rounded-2xl p-4">
              <span className="w-11 h-11 rounded-xl bg-flora-green/10 text-flora-green flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5" /></span>
              <div><b className="block text-sm flora-ink">{business.phone}</b><span className="text-xs flora-muted">Telefone & WhatsApp</span></div>
            </div>
          )}
        </section>

        {/* Redes sociais extras */}
        {feat.redesSociais && (business.facebook || business.linkedin || business.youtube) && (
          <div className="flex items-center gap-2.5 mt-6">
            <span className="text-xs font-semibold uppercase tracking-wider flora-muted">Também em</span>
            {business.facebook && <a href={business.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full flora-chip flex items-center justify-center text-flora-green hover:text-flora-fresh transition-all"><Facebook className="w-5 h-5" /></a>}
            {business.linkedin && <a href={business.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 rounded-full flora-chip flex items-center justify-center text-flora-green hover:text-flora-fresh transition-all"><Linkedin className="w-5 h-5" /></a>}
            {business.youtube && <a href={business.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 rounded-full flora-chip flex items-center justify-center text-flora-green hover:text-flora-fresh transition-all"><Youtube className="w-5 h-5" /></a>}
          </div>
        )}

        {/* ── Galeria ────────────────────────────────────────────── */}
        {business.photos.length > 0 && (
          <section className="pt-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-flora-fresh"><Images className="w-3.5 h-3.5" /> Galeria</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-2 mb-5">O ambiente</h2>
            <PhotoGallery photos={business.photos.map(p => p.url)} name={business.name} />
          </section>
        )}

        {/* ── Vitrine ────────────────────────────────────────────── */}
        {showcaseProducts.length > 0 && (
          <section className="pt-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-flora-fresh"><ShoppingBag className="w-3.5 h-3.5" /> Vitrine</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-2 mb-5">O que oferecemos</h2>
            <ProductShowcase
              products={showcaseProducts}
              businessId={business.id}
              whatsapp={business.whatsapp}
              storeMessage={business.storeWhatsappMessage}
              businessUrl={businessUrl}
              storeHref={feat.loja ? storeHref : undefined}
            />
          </section>
        )}

        {/* ── Avaliações ─────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section className="pt-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-flora-fresh"><Star className="w-3.5 h-3.5" /> O que dizem</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-2 mb-5">Avaliações no Google</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {reviews.map((r, i) => (
                <div key={i} className="flora-card rounded-2xl p-6 flex flex-col gap-3.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < Math.round(r.rating ?? 0) ? "fill-flora-gold text-flora-gold" : "text-flora-soft/40"}`} />
                    ))}
                  </div>
                  <p className="text-sm flora-ink/90 leading-relaxed line-clamp-5 flex-1">“{r.text?.text}”</p>
                  <div className="flex items-center gap-2.5 pt-1">
                    {r.authorAttribution?.photoUri ? (
                      <img src={r.authorAttribution.photoUri} alt="" className="w-8 h-8 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-flora-green/15 flex items-center justify-center text-flora-green text-sm font-bold">{(r.authorAttribution?.displayName ?? "?")[0]}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold flora-ink truncate">{r.authorAttribution?.displayName ?? "Visitante"}</p>
                      {r.relativePublishTimeDescription && <p className="text-[11px] flora-muted">{r.relativePublishTimeDescription}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Localização & horários ─────────────────────────────── */}
        <section className="pt-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-flora-fresh"><MapPinned className="w-3.5 h-3.5" /> Onde fica</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-2 mb-5">Localização & horários</h2>
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div>
              <BusinessMap lat={business.latitude} lng={business.longitude} name={business.name} address={business.address} mapsUrl={mapsUrl} />
            </div>
            {hasHours && (
              <div className="flora-card rounded-3xl p-6">
                <h3 className="font-serif text-lg font-semibold flora-ink mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-flora-green" /> Horários</h3>
                <ul className="space-y-2.5">
                  {weekTable.map((row, i) => (
                    <li key={i} className={`flex justify-between gap-4 text-sm ${i === todayIdx ? "font-semibold" : ""}`}>
                      <span className={i === todayIdx ? "flora-ink" : "flora-muted"}>{row.label}</span>
                      <span className="flora-ink text-right">{row.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Claim */}
        {!business.ownerId && <div className="pt-12"><ClaimBanner businessId={business.id} businessName={business.name} /></div>}

        {/* Atribuição obrigatória — Google Places TOS */}
        {(business.googleRating || business.photos.some(p => p.source === "GOOGLE_PLACES")) && (
          <p className="mt-10 text-xs text-gray-300 dark:text-white/20 text-center">Algumas informações e fotos fornecidas por Google</p>
        )}
      </main>

      {/* WhatsApp flutuante — sempre à mão (já trackeia) */}
      {business.whatsapp && (
        <FloatingWhatsApp businessId={business.id} whatsapp={business.whatsapp} storeMessage={business.storeWhatsappMessage} businessUrl={businessUrl} />
      )}
    </>
  )
}
