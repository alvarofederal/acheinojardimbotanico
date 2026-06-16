/**
 * src/lib/site-visibility.ts  (SERVER ONLY)
 * Visibilidade das funcionalidades no site público (navbar/footer/página/perfil).
 * Uma funcionalidade aparece SOMENTE quando: a chave do admin (SiteConfig) está
 * LIGADA **e** existe >=1 conteúdo publicado. Cache curto; só consulta o que
 * estiver ligado (chave off => zero query). Nasce tudo off (SiteConfig ausente).
 */
import { db } from "@/lib/prisma"
import { getPlanConfigs } from "@/lib/plan-config"
import { PLAN_IDS } from "@/lib/plans"

export type MenuFeature = "promocoes" | "noticias" | "eventos" | "vagas"
export type MenuVisibility = Record<MenuFeature, boolean>

const ALL_OFF: MenuVisibility = { promocoes: false, noticias: false, eventos: false, vagas: false }

let cache: { data: MenuVisibility; at: number } | null = null
const TTL_MS = 60_000

/** Invalida o cache (chamar após salvar as chaves no admin). */
export function invalidateSiteVisibilityCache() { cache = null }

export async function getMenuVisibility(): Promise<MenuVisibility> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data

  const cfg = await db.siteConfig.findUnique({ where: { id: "default" } })
  if (!cfg) { cache = { data: ALL_OFF, at: Date.now() }; return ALL_OFF }

  const plans = await getPlanConfigs()
  const promoPlans = PLAN_IDS.filter(p => plans[p].features.promocoes)
  const vagasPlans = PLAN_IDS.filter(p => plans[p].features.vagas && plans[p].vagaLimit > 0)

  // Conta só o que a chave liga — chave desligada nem chega a consultar o banco.
  const [promoN, noticiasN, eventosN, vagasN] = await Promise.all([
    cfg.showPromocoes && promoPlans.length
      ? db.product.count({ where: { active: true, soldOut: false, promoPriceCents: { not: null }, business: { status: { in: ["IMPORTED", "CLAIMED"] }, plan: { in: promoPlans } } } })
      : Promise.resolve(0),
    cfg.showNoticias ? db.news.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(0),
    cfg.showEventos ? db.event.count({ where: { status: "PUBLISHED" } }) : Promise.resolve(0),
    cfg.showVagas && vagasPlans.length
      ? db.vaga.count({ where: { active: true, business: { ownerId: { not: null }, plan: { in: vagasPlans } } } })
      : Promise.resolve(0),
  ])

  const data: MenuVisibility = {
    promocoes: cfg.showPromocoes && promoN > 0,
    noticias: cfg.showNoticias && noticiasN > 0,
    eventos: cfg.showEventos && eventosN > 0,
    vagas: cfg.showVagas && vagasN > 0,
  }
  cache = { data, at: Date.now() }
  return data
}
