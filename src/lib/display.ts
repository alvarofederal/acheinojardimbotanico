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
  photos?: { url: string }[]
  whatsapp?: string | null
  phone?: string | null
}

/**
 * Monta os dados do cartão de display a partir de um negócio.
 * Usa o link curto (handle) se existir; senão, a URL canônica.
 * A imagem do avatar vem da 1ª foto; senão da capa da loja.
 */
export function buildDisplayData(b: BusinessForDisplay): DisplayCardData {
  const path = b.handle
    ? `/${b.handle}`
    : `/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
  const url = `${SITE_URL}${path}`
  const label = url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const imageUrl = b.photos?.[0]?.url ?? b.storeCoverUrl ?? null
  return { name: b.name, category: b.category.name, url, label, imageUrl }
}

/** Dados do cartão de visita do lojista (reusa a URL/foto do display + contato). */
export function buildCardData(b: BusinessForDisplay): CardCardData {
  const d = buildDisplayData(b)
  const contact = b.whatsapp || b.phone || null
  return {
    title: d.name,
    subtitle: d.category,
    url: d.url,
    label: d.label,
    imageUrl: d.imageUrl,
    lines: contact ? [contact] : [],
  }
}
