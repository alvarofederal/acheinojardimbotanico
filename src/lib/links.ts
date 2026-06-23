import { slugify, SITE_URL } from "@/lib/utils"

/**
 * Caminho público de um negócio — FONTE ÚNICA da URL do perfil.
 *
 * Desde 2026-06: o `handle` (slug curto, ex.: /arte-e-tradicao) é o ENDEREÇO REAL,
 * curto e bonito, do perfil. Quem ainda não tem handle cai na URL longa canônica
 * /{bairro}/{categoria}/{slug} (transição; o backfill dá handle a todos).
 *
 * Use SEMPRE estes helpers pra montar link de perfil/loja — nunca concatene à mão.
 */
type LinkBusiness = {
  handle?: string | null
  slug: string
  neighborhood: string
  category: { slug: string }
}

/** Caminho relativo do perfil (começa com "/"). */
export function profilePath(b: LinkBusiness): string {
  return b.handle
    ? `/${b.handle}`
    : `/${slugify(b.neighborhood)}/${b.category.slug}/${b.slug}`
}

/** Caminho relativo da loja (perfil + /loja). */
export function lojaPath(b: LinkBusiness): string {
  return `${profilePath(b)}/loja`
}

/** URL absoluta do perfil (pra compartilhar, JSON-LD, OpenGraph, sitemap). */
export function profileUrl(b: LinkBusiness): string {
  return `${SITE_URL}${profilePath(b)}`
}

/** URL absoluta da loja. */
export function lojaUrl(b: LinkBusiness): string {
  return `${SITE_URL}${lojaPath(b)}`
}
