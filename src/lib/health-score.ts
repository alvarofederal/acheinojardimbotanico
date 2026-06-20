/**
 * src/lib/health-score.ts
 * "Radar Fantasma" — score de SAÚDE do perfil (0–100), calculado a partir do
 * que JÁ importamos do Google (custo zero). Quanto MENOR, mais abandonado =
 * melhor prospecto.
 *
 * Honestidade: isto NÃO diz se o perfil tem dono, se foi reivindicado, nem
 * quantos contatos recebe (a API pública do Google não expõe). É um PROXY
 * forte — perfil capenga = dono ausente.
 */

export type HealthState = "morto" | "fraco" | "saudavel"

export interface HealthInput {
  phone: string | null
  whatsapp: string | null
  website: string | null
  instagram: string | null
  description: string | null
  openingHours: unknown
  googleRatingCount: number | null
  photoCount: number
}

export interface HealthResult {
  /** 0–100 (saúde). Quanto menor, mais abandonado. */
  score: number
  state: HealthState
  /** O que falta no perfil (rótulos prontos pra exibir). */
  missing: string[]
  /** "Popular e negligenciado": tem movimento (avaliações) mas o perfil está capenga. O melhor lead. */
  hot: boolean
  /** Dá pra falar com ele (tem telefone/WhatsApp)? */
  reachable: boolean
}

/** Detecta horário tanto no formato do Google (weekdayDescriptions/periods) quanto no nosso (periods). */
function hasHours(oh: unknown): boolean {
  if (!oh || typeof oh !== "object") return false
  const o = oh as { periods?: unknown[]; weekdayDescriptions?: unknown[] }
  return (Array.isArray(o.periods) && o.periods.length > 0)
    || (Array.isArray(o.weekdayDescriptions) && o.weekdayDescriptions.length > 0)
}

export function healthScore(i: HealthInput): HealthResult {
  const reachable = !!(i.phone || i.whatsapp)
  const reviews = i.googleRatingCount ?? 0
  const photos = i.photoCount
  const missing: string[] = []
  let score = 0

  // contato — o sinal mais forte (e o que viabiliza a abordagem)
  if (reachable) score += 25
  else missing.push("Sem telefone/WhatsApp")

  if (hasHours(i.openingHours)) score += 15
  else missing.push("Sem horário")

  if (photos >= 3) score += 15
  else if (photos >= 1) { score += 8; missing.push("Poucas fotos") }
  else missing.push("Sem foto")

  if (i.description && i.description.trim().length > 0) score += 15
  else missing.push("Sem descrição")

  if (i.website) score += 10
  else missing.push("Sem site")

  if (i.instagram) score += 5
  else missing.push("Sem Instagram")

  if (reviews >= 10) score += 15
  else if (reviews >= 1) { score += reviews >= 5 ? 10 : 5; missing.push("Poucas avaliações") }
  else missing.push("Sem avaliações")

  const state: HealthState = score < 35 ? "morto" : score < 65 ? "fraco" : "saudavel"
  // tem público (avaliações) mas o dono deixou o perfil capenga → "sim" fácil
  const hot = reviews >= 10 && score < 55

  return { score, state, missing, hot, reachable }
}
