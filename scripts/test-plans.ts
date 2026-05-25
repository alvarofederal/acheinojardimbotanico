/**
 * Teste profundo do sistema de Planos & Cobrança.
 * Grava configs de teste, lê de volta pela mesma camada que a aplicação usa
 * (getPlanConfigs / planHasFeature / productLimit / photoLimit / planPriceCents),
 * valida cada flag/limite/preço e RESTAURA o estado original no fim.
 *
 * Uso: node_modules/.bin/tsx scripts/test-plans.ts
 */
import "dotenv/config"
import { db } from "../src/lib/prisma"
import {
  getPlanConfigs, getPlanConfig, planHasFeature, productLimit, photoLimit,
  planPriceCents, invalidatePlanConfigCache,
} from "../src/lib/plan-config"
import { PLAN_FEATURE_KEYS, PLAN_IDS, type PlanId, type PlanFeature, type PlanFeatures } from "../src/lib/plans"

let pass = 0, fail = 0
const ok = (b: boolean, msg: string) => { console.log(`${b ? "✅" : "❌"} ${msg}`); b ? pass++ : fail++ }

function mkFeatures(on: PlanFeature[]): PlanFeatures {
  const f = Object.fromEntries(PLAN_FEATURE_KEYS.map(k => [k, false])) as PlanFeatures
  on.forEach(k => { f[k] = true })
  return f
}

async function main() {
  console.log("🧪 Teste profundo — Planos & Cobrança\n")

  // 1) Backup do estado atual
  const backup = await db.planConfig.findMany()
  console.log(`📦 Backup de ${backup.length} planos guardado\n`)

  try {
    // 2) Grava um cenário de teste conhecido (simulando o "Salvar tudo" do admin)
    const scenarios: { plan: PlanId; priceCents: number; productLimit: number; photoLimit: number; features: PlanFeature[]; active: boolean }[] = [
      { plan: "FREE",       priceCents: 0,    productLimit: 1, photoLimit: 2, active: true,  features: ["redesSociais"] },
      { plan: "VISIBILITY", priceCents: 4990, productLimit: 7, photoLimit: 5, active: true,  features: ["promocoes", "metricas", "selo"] },
      { plan: "PREMIUM",    priceCents: 9990, productLimit: 99, photoLimit: 30, active: true, features: PLAN_FEATURE_KEYS },
    ]

    for (const s of scenarios) {
      await db.planConfig.upsert({
        where: { plan: s.plan },
        create: { plan: s.plan, label: s.plan, active: s.active, order: 0, priceCents: s.priceCents, productLimit: s.productLimit, photoLimit: s.photoLimit, features: mkFeatures(s.features) as object },
        update: { priceCents: s.priceCents, productLimit: s.productLimit, photoLimit: s.photoLimit, active: s.active, features: mkFeatures(s.features) as object },
      })
    }
    invalidatePlanConfigCache()
    console.log("💾 Cenário de teste gravado\n")

    // 3) Lê de volta pela camada da aplicação
    const cfgs = await getPlanConfigs()
    ok(PLAN_IDS.every(p => cfgs[p]), "getPlanConfigs() retorna os 3 planos")

    // 4) Preços
    ok((await planPriceCents("VISIBILITY", 1)) === 4990, "Preço Visibilidade 1 mês = R$49,90")
    ok((await planPriceCents("VISIBILITY", 3)) === 14970, "Preço Visibilidade 3 meses = R$149,70")
    ok((await planPriceCents("PREMIUM", 1)) === 9990, "Preço Premium 1 mês = R$99,90")
    ok((await planPriceCents("FREE", 1)) === 0, "Preço Free = R$0")

    // 5) Limites
    ok((await productLimit("FREE")) === 1, "Limite produtos Free = 1")
    ok((await productLimit("VISIBILITY")) === 7, "Limite produtos Visibilidade = 7")
    ok((await photoLimit("VISIBILITY")) === 5, "Limite fotos Visibilidade = 5")
    ok((await photoLimit("PREMIUM")) === 30, "Limite fotos Premium = 30")

    // 6) Cada um dos 7 recursos respeita o que foi marcado
    console.log("\n  -- Recursos por plano --")
    // VISIBILITY: só promocoes, metricas, selo ligados
    const visOn: PlanFeature[] = ["promocoes", "metricas", "selo"]
    for (const f of PLAN_FEATURE_KEYS) {
      const expected = visOn.includes(f)
      ok((await planHasFeature("VISIBILITY", f)) === expected, `VISIBILITY.${f} = ${expected}`)
    }
    // FREE: só redesSociais
    ok((await planHasFeature("FREE", "redesSociais")) === true, "FREE.redesSociais = true")
    ok((await planHasFeature("FREE", "eventos")) === false, "FREE.eventos = false")
    // PREMIUM: tudo ligado
    const premChecks = await Promise.all(PLAN_FEATURE_KEYS.map(f => planHasFeature("PREMIUM", f)))
    ok(premChecks.every(Boolean), "PREMIUM tem TODOS os 7 recursos ligados")

    // 7) Simula um toggle isolado (liga "eventos" no Visibilidade) e confirma propagação
    console.log("\n  -- Toggle isolado --")
    const cur = await getPlanConfig("VISIBILITY")
    await db.planConfig.update({
      where: { plan: "VISIBILITY" },
      data: { features: { ...cur.features, eventos: true } as object },
    })
    invalidatePlanConfigCache()
    ok((await planHasFeature("VISIBILITY", "eventos")) === true, "Após ligar eventos no Visibilidade → reflete na camada")
    ok((await planHasFeature("VISIBILITY", "loja")) === false, "Loja continua desligada (toggle não vazou)")

    // 8) Cache: alteração sem invalidar NÃO aparece; com invalidar, aparece
    console.log("\n  -- Cache --")
    await db.planConfig.update({ where: { plan: "PREMIUM" }, data: { priceCents: 11111 } })
    const cachedPrice = await planPriceCents("PREMIUM", 1)
    ok(cachedPrice === 9990, "Sem invalidar cache → preço antigo (cache funciona)")
    invalidatePlanConfigCache()
    ok((await planPriceCents("PREMIUM", 1)) === 11111, "Após invalidar → preço novo")

  } finally {
    // 9) Restaura backup
    for (const b of backup) {
      await db.planConfig.update({
        where: { plan: b.plan },
        data: { label: b.label, active: b.active, order: b.order, priceCents: b.priceCents, productLimit: b.productLimit, photoLimit: b.photoLimit, features: b.features as object },
      })
    }
    invalidatePlanConfigCache()
    console.log("\n♻️  Estado original restaurado")
  }

  console.log(`\n${fail === 0 ? "🎉" : "⚠️ "} Resultado: ${pass} passou, ${fail} falhou`)
  await db.$disconnect()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
