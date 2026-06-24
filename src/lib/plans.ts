/**
 * src/lib/plans.ts
 * Tipos, defaults e helpers PUROS dos planos (sem acesso a banco — pode ser
 * importado por client components). O estado real (editável pelo admin) vive
 * no model PlanConfig e é carregado por src/lib/plan-config.ts.
 */

export type PlanId = "FREE" | "VISIBILITY" | "PREMIUM"

/** Recursos liga/desliga por plano (feature flags). */
export type PlanFeature =
  | "promocoes"
  | "oferta"
  | "loja"
  | "eventos"
  | "metricas"
  | "destaque"
  | "redesSociais"
  | "selo"
  | "cartao"
  | "vagas"

/** Metadados dos recursos — usado para renderizar os checkboxes no admin. */
export const PLAN_FEATURES: { key: PlanFeature; label: string; description: string }[] = [
  { key: "promocoes", label: "Promoções (ofertas)", description: "Marcar preço promocional e aparecer em /promocoes" },
  { key: "oferta", label: "Oferta em destaque no perfil", description: "Banner de oferta com prazo/urgência no topo do perfil, com CTA no WhatsApp" },
  { key: "loja", label: "Loja completa", description: "Página de vitrine dedicada (/loja) com galeria ampliada" },
  { key: "eventos", label: "Eventos", description: "Submeter eventos para moderação do admin" },
  { key: "metricas", label: "Métricas / ROI", description: "Dashboard de visitas e cliques no WhatsApp" },
  { key: "destaque", label: "Destaque na listagem", description: "Prioridade de posição na busca e na home" },
  { key: "redesSociais", label: "Redes sociais", description: "Exibir Instagram, Facebook, LinkedIn e YouTube no perfil" },
  { key: "selo", label: "Selo de verificado", description: "Badge de negócio verificado/pagante no perfil" },
  { key: "cartao", label: "Cartão de visita", description: "Gerar cartão de visita do negócio (logo + QR + link) para impressão" },
  { key: "vagas", label: "Vagas (oportunidades)", description: "Publicar vagas de emprego — aparecem no perfil e na página /vagas" },
]

export const PLAN_FEATURE_KEYS = PLAN_FEATURES.map(f => f.key)

export type PlanFeatures = Record<PlanFeature, boolean>

export interface PlanConfigData {
  plan: PlanId
  label: string
  active: boolean
  order: number
  priceCents: number
  productLimit: number
  photoLimit: number
  vagaLimit: number
  features: PlanFeatures
  mercadoPagoLink: string | null
}

const allFeatures = (v: boolean): PlanFeatures => ({
  promocoes: v, oferta: v, loja: v, eventos: v, metricas: v, destaque: v, redesSociais: v, selo: v, cartao: v, vagas: v,
})

/** Configuração-padrão (fallback quando o banco ainda não tem PlanConfig + seed inicial). */
export const DEFAULT_PLAN_CONFIGS: Record<PlanId, PlanConfigData> = {
  FREE: {
    plan: "FREE", label: "Free", active: true, order: 0,
    priceCents: 0, productLimit: 2, photoLimit: 3, vagaLimit: 0,
    features: { ...allFeatures(false), redesSociais: true },
    mercadoPagoLink: null,
  },
  VISIBILITY: {
    plan: "VISIBILITY", label: "Visibilidade", active: true, order: 1,
    priceCents: 7900, productLimit: 10, photoLimit: 6, vagaLimit: 5,
    features: { ...allFeatures(true), destaque: false, oferta: false }, // oferta = só Premium
    mercadoPagoLink: null,
  },
  PREMIUM: {
    plan: "PREMIUM", label: "Premium", active: true, order: 2,
    priceCents: 19700, productLimit: 50, photoLimit: 20, vagaLimit: 10,
    features: allFeatures(true),
    mercadoPagoLink: null,
  },
}

export const PLAN_IDS: PlanId[] = ["FREE", "VISIBILITY", "PREMIUM"]

/** Períodos de assinatura oferecidos (meses). */
export const PLAN_MONTHS = [1, 3, 6, 12] as const

// ---- compat / atalhos derivados dos defaults (fallback) ----
export const PLAN_LABEL: Record<PlanId, string> = {
  FREE: DEFAULT_PLAN_CONFIGS.FREE.label,
  VISIBILITY: DEFAULT_PLAN_CONFIGS.VISIBILITY.label,
  PREMIUM: DEFAULT_PLAN_CONFIGS.PREMIUM.label,
}

/** Normaliza um objeto Json vindo do banco para PlanFeatures completo. */
export function normalizeFeatures(raw: unknown): PlanFeatures {
  const base = allFeatures(false)
  if (raw && typeof raw === "object") {
    for (const k of PLAN_FEATURE_KEYS) {
      if ((raw as Record<string, unknown>)[k] === true) base[k] = true
    }
  }
  return base
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

/** Linhas de recurso para exibição (cards de plano), derivadas da config. */
export function planDisplayFeatures(cfg: PlanConfigData): string[] {
  const lines: string[] = [
    `Até ${cfg.productLimit} produto${cfg.productLimit === 1 ? "" : "s"} na vitrine`,
    `Até ${cfg.photoLimit} foto${cfg.photoLimit === 1 ? "" : "s"} do perfil`,
  ]
  if (cfg.features.vagas && cfg.vagaLimit > 0)
    lines.push(`Até ${cfg.vagaLimit} vaga${cfg.vagaLimit === 1 ? "" : "s"} de emprego`)
  for (const f of PLAN_FEATURES) {
    if (f.key === "vagas") continue // já exibido como linha de limite acima
    if (cfg.features[f.key]) lines.push(f.label)
  }
  return lines
}
