/**
 * src/lib/api-costs.ts
 * Estimativa de custos da Google Places API (New).
 *
 * IMPORTANTE: estes valores são ESTIMATIVAS para planejamento. Os preços reais
 * variam por tier e volume (descontos progressivos) e devem ser conferidos na
 * fatura do Google Cloud. Ajuste aqui (ou via env) conforme sua realidade.
 *
 * Usamos campos "Atmosphere" (fotos, reviews), então cada busca cai no tier mais
 * caro (Enterprise + Atmosphere). Preços-base por requisição, em USD:
 *   - Nearby Search:  ~US$ 0,040
 *   - Text Search:    ~US$ 0,040
 *   - Place Photo:    ~US$ 0,007  (cobrado a cada exibição de foto)
 *   - Place Details:  ~US$ 0,040
 */

const env = (k: string, fallback: number) => {
  const v = process.env[k]
  const n = v ? Number(v) : NaN
  return Number.isFinite(n) ? n : fallback
}

/** Custo por requisição, em USD. Sobrescrevível por env. */
export const COST_USD = {
  NEARBY: env("COST_NEARBY_USD", 0.04),
  TEXT: env("COST_TEXT_USD", 0.04),
  PHOTO: env("COST_PHOTO_USD", 0.007),
  DETAILS: env("COST_DETAILS_USD", 0.04),
} as const

export type ApiKind = keyof typeof COST_USD

/** Câmbio USD → BRL (configurável via env CAMBIO_USD_BRL). */
export const USD_BRL = env("CAMBIO_USD_BRL", 5.3)

/** Crédito gratuito mensal do Google Maps Platform, em USD. */
export const FREE_CREDIT_USD = env("GOOGLE_FREE_CREDIT_USD", 200)

export function costUsd(kind: ApiKind, units = 1): number {
  return COST_USD[kind] * units
}

export function toBrl(usd: number): number {
  return usd * USD_BRL
}

export const KIND_LABEL: Record<ApiKind, string> = {
  NEARBY: "Busca por proximidade",
  TEXT: "Busca por texto",
  PHOTO: "Exibição de foto",
  DETAILS: "Detalhes do lugar",
}
