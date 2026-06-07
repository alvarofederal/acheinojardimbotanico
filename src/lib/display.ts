import { slugify, SITE_URL } from "@/lib/utils"
import type { DisplayCardData } from "@/components/display-card"
import type { CardCardData } from "@/components/card-card"

interface BusinessForDisplay {
  name: string
  handle: string | null
  slug: string
  neighborhood: string
  category: { name: string; slug: string }
  storeCoverUrl?: string | null
  logoUrl?: string | null
  photos?: { url: string }[]
  whatsapp?: string | null
  phone?: string | null
}

/**
 * URL de avatar quadrado em alta qualidade via Cloudinary (nítido pra impressão).
 *  - mode "logo": tile branco com a logo INTEIRA (c_pad,b_white) — não corta.
 *  - mode "photo": recorte quadrado focado no assunto (c_fill,g_auto).
 * URLs que não são do Cloudinary (ex.: Google) voltam sem alteração.
 */
function cloudinaryAvatar(url: string | null, mode: "photo" | "logo" = "photo", size = 400): string | null {
  if (!url) return null
  const marker = "/image/upload/"
  const i = url.indexOf(marker)
  if (!url.includes("res.cloudinary.com") || i === -1) return url
  const tx = mode === "logo"
    ? `c_pad,b_white,w_${size},h_${size},q_auto:best,f_auto`
    : `c_fill,g_auto,w_${size},h_${size},q_auto:best,f_auto`
  return url.slice(0, i + marker.length) + tx + "/" + url.slice(i + marker.length)
}

/**
 * Monta os dados do cartão de display a partir de um negócio.
 * Usa o link curto (handle) se existir; senão, a URL canônica.
 * Imagem principal = capa escolhida pelo lojista (igual ao storefront); cai na 1ª foto.
 */
export function buildDisplayData(b: BusinessForDisplay): DisplayCardData {
  const path = b.handle
    ? `/${b.handle}`
    : `/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
  const url = `${SITE_URL}${path}`
  const label = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  // Prioridade: logo curada pelo admin (tile branco) → capa do lojista → 1ª foto (recorte).
  const imageUrl =
    cloudinaryAvatar(b.logoUrl ?? null, "logo") ??
    cloudinaryAvatar(b.storeCoverUrl ?? b.photos?.[0]?.url ?? null, "photo")
  return { name: b.name, category: b.category.name, url, label, imageUrl }
}

/** Dados do cartão de visita do lojista (reusa a URL/foto do display + contato). */
export function buildCardData(b: BusinessForDisplay): CardCardData {
  const d = buildDisplayData(b)
  const contact = b.whatsapp || b.phone || null
  const lines: string[] = []
  if (contact) lines.push(contact)
  lines.push(d.label)
  return { title: d.name, subtitle: null, url: d.url, imageUrl: d.imageUrl, lines }
}

/**
 * Imagem atual usada no cartão/display (mesma prioridade: logo → capa → foto) +
 * se é a logo curada pelo admin. Útil na lista do admin pra ver quem já tem logo.
 * `size` em px (thumbnail).
 */
export function businessImage(
  b: { logoUrl?: string | null; storeCoverUrl?: string | null; photos?: { url: string }[] },
  size = 96,
): { url: string | null; isLogo: boolean } {
  const logo = cloudinaryAvatar(b.logoUrl ?? null, "logo", size)
  if (logo) return { url: logo, isLogo: true }
  return { url: cloudinaryAvatar(b.storeCoverUrl ?? b.photos?.[0]?.url ?? null, "photo", size), isLogo: false }
}
