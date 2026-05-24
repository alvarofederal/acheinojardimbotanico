/**
 * src/lib/plans.ts
 * Configuração central dos planos do Achei — valores, limites e rótulos.
 */

export type PlanId = "FREE" | "VISIBILITY" | "PREMIUM"

export const PLAN_PRICE: Record<PlanId, number> = {
  FREE: 0,
  VISIBILITY: 79,
  PREMIUM: 197,
}

export const PLAN_LABEL: Record<PlanId, string> = {
  FREE: "Free",
  VISIBILITY: "Visibilidade",
  PREMIUM: "Premium",
}

/** Limite de produtos na vitrine, por plano. */
export const PRODUCT_LIMITS: Record<PlanId, number> = {
  FREE: 2,
  VISIBILITY: 10,
  PREMIUM: 50,
}

/** Limite de fotos do próprio negócio (perfil), por plano. */
export const PHOTO_LIMITS: Record<PlanId, number> = {
  FREE: 3,
  VISIBILITY: 6,
  PREMIUM: 20,
}

/** Períodos de assinatura oferecidos (meses). */
export const PLAN_MONTHS = [1, 3, 6, 12] as const

export function planPriceCents(plan: PlanId, months = 1): number {
  return PLAN_PRICE[plan] * 100 * months
}

export interface ConfigPrices {
  visibilityCents: number
  premiumCents: number
}

/** Preço de 1 mês (em centavos) considerando a config do admin (com fallback). */
export function priceCentsFor(plan: PlanId, cfg?: ConfigPrices | null): number {
  if (plan === "VISIBILITY") return cfg?.visibilityCents ?? PLAN_PRICE.VISIBILITY * 100
  if (plan === "PREMIUM") return cfg?.premiumCents ?? PLAN_PRICE.PREMIUM * 100
  return 0
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
