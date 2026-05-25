/**
 * src/lib/plan-config.ts  (SERVER ONLY)
 * Carrega a configuração dos planos do banco (model PlanConfig), com cache
 * curto e seed automático a partir de DEFAULT_PLAN_CONFIGS. Toda checagem de
 * preço / limite / recurso da aplicação passa por aqui.
 */
import { db } from "@/lib/prisma"
import {
  DEFAULT_PLAN_CONFIGS, PLAN_IDS, normalizeFeatures,
  type PlanId, type PlanConfigData, type PlanFeature,
} from "@/lib/plans"

type CacheEntry = { data: Record<PlanId, PlanConfigData>; at: number }
let cache: CacheEntry | null = null
const TTL_MS = 30_000 // 30s — o admin vê a mudança quase na hora

/** Invalida o cache (chamar após salvar config no admin). */
export function invalidatePlanConfigCache() {
  cache = null
}

/** Carrega as 3 configs do banco; cria os registros que faltarem (seed). */
export async function getPlanConfigs(): Promise<Record<PlanId, PlanConfigData>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data

  const rows = await db.planConfig.findMany()
  const byPlan = new Map(rows.map(r => [r.plan as PlanId, r]))

  // Seed: garante uma linha por plano. Idempotente e tolerante a corrida
  // (vários workers do build podem semear ao mesmo tempo → ignora P2002).
  const missing = PLAN_IDS.filter(p => !byPlan.has(p))
  if (missing.length > 0) {
    await Promise.all(missing.map(async p => {
      const d = DEFAULT_PLAN_CONFIGS[p]
      try {
        await db.planConfig.upsert({
          where: { plan: p },
          create: {
            plan: p, label: d.label, active: d.active, order: d.order,
            priceCents: d.priceCents, productLimit: d.productLimit, photoLimit: d.photoLimit,
            features: d.features,
          },
          update: {},
        })
      } catch { /* já criado por outro processo */ }
    }))
    const fresh = await db.planConfig.findMany()
    fresh.forEach(r => byPlan.set(r.plan as PlanId, r))
  }

  const data = {} as Record<PlanId, PlanConfigData>
  for (const p of PLAN_IDS) {
    const r = byPlan.get(p)
    const d = DEFAULT_PLAN_CONFIGS[p]
    data[p] = r
      ? {
          plan: p, label: r.label, active: r.active, order: r.order,
          priceCents: r.priceCents, productLimit: r.productLimit, photoLimit: r.photoLimit,
          features: normalizeFeatures(r.features),
        }
      : d
  }

  cache = { data, at: Date.now() }
  return data
}

export async function getPlanConfig(plan: PlanId): Promise<PlanConfigData> {
  return (await getPlanConfigs())[plan]
}

/** Preço de 1 mês (centavos) do plano, conforme config do admin. */
export async function planPriceCents(plan: PlanId, months = 1): Promise<number> {
  return (await getPlanConfig(plan)).priceCents * months
}

/** Limite de produtos do plano. */
export async function productLimit(plan: PlanId): Promise<number> {
  return (await getPlanConfig(plan)).productLimit
}

/** Limite de fotos do perfil do plano. */
export async function photoLimit(plan: PlanId): Promise<number> {
  return (await getPlanConfig(plan)).photoLimit
}

/** Se o plano libera um recurso específico. */
export async function planHasFeature(plan: PlanId, feature: PlanFeature): Promise<boolean> {
  return (await getPlanConfig(plan)).features[feature] === true
}
