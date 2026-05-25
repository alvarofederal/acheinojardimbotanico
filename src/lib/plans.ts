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
  | "loja"
  | "eventos"
  | "metricas"
  | "destaque"
  | "redesSociais"
  | "selo"

/** Metadados dos recursos — usado para renderizar os checkboxes no admin. */
export const PLAN_FEATURES: { key: PlanFeature; label: string; description: string }[] = [
  { key: "promocoes", label: "Promoções (ofertas)", description: "Marcar preço promocional e aparecer em /promocoes" },
  { key: "loja", label: "Loja completa", description: "Página de vitrine dedicada (/loja) com galeria ampliada" },
  { key: "eventos", label: "Eventos", description: "Submeter eventos para moderação do admin" },
  { key: "metricas", label: "Métricas / ROI", description: "Dashboard de visitas e cliques no WhatsApp" },
  { key: "destaque", label: "Destaque na listagem", description: "Prioridade de posição na busca e na home" },
  { key: "redesSociais", label: "Redes sociais", description: "Exibir Instagram, Facebook, LinkedIn e YouTube no perfil" },
  { key: "selo", label: "Selo de verificado", description: "Badge de negócio verificado/pagante no perfil" },
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
  features: PlanFeatures
}

const allFeatures = (v: boolean): PlanFeatures => ({
  promocoes: v, loja: v, eventos: v, metricas: v, destaque: v, redesSociais: v, selo: v,
})

/** Configuração-padrão (fallback quando o banco ainda não tem PlanConfig + seed inicial). */
export const DEFAULT_PLAN_CONFIGS: Record<PlanId, PlanConfigData> = {
  FREE: {
    plan: "FREE", label: "Free", active: true, order: 0,
    priceCents: 0, productLimit: 2, photoLimit: 3,
    features: { ...allFeatures(false), redesSociais: true },
  },
  VISIBILITY: {
    plan: "VISIBILITY", label: "Visibilidade", active: true, order: 1,
    priceCents: 7900, productLimit: 10, photoLimit: 6,
    features: { ...allFeatures(true), destaque: false },
  },
  PREMIUM: {
    plan: "PREMIUM", label: "Premium", active: true, order: 2,
    priceCents: 19700, productLimit: 50, photoLimit: 20,
    features: allFeatures(true),
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
  for (const f of PLAN_FEATURES) {
    if (cfg.features[f.key]) lines.push(f.label)
  }
  return lines
}
