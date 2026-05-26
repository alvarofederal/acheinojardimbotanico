/**
 * Teste da Cortesia (ativação sem receita).
 * Garante que: cortesia ativa o plano, mas NÃO entra no "total recebido" nem no MRR;
 * conversão para pago entra; expiração limpa o flag. Restaura tudo no fim.
 *
 * Uso: node_modules/.bin/tsx scripts/test-cortesia.ts
 */
import "dotenv/config"
import { db } from "../src/lib/prisma"
import { getPlanConfigs } from "../src/lib/plan-config"
import { type PlanId } from "../src/lib/plans"

let pass = 0, fail = 0
const ok = (b: boolean, m: string) => { console.log(`${b ? "✅" : "❌"} ${m}`); b ? pass++ : fail++ }

// replica a lógica do painel financeiro
async function receita() {
  const agg = await db.paymentClaim.aggregate({ where: { status: "CONFIRMED", method: { not: "COURTESY" } }, _sum: { amountCents: true } })
  return agg._sum.amountCents ?? 0
}
async function mrr() {
  const cfgs = await getPlanConfigs()
  const list = await db.business.findMany({ where: { plan: { in: ["VISIBILITY", "PREMIUM"] }, planExpiresAt: { gt: new Date() } }, select: { plan: true, planIsCourtesy: true } })
  return list.filter(b => !b.planIsCourtesy).reduce((s, b) => s + (cfgs[b.plan as PlanId]?.priceCents ?? 0), 0)
}

async function main() {
  console.log("🧪 Teste — Cortesia (ativação sem receita)\n")

  const biz = await db.business.findFirst({ where: { ownerId: { not: null } }, select: { id: true, name: true, ownerId: true, plan: true, planExpiresAt: true, planIsCourtesy: true } })
  if (!biz) { console.error("Preciso de um negócio com dono (reivindicado)"); process.exit(1) }
  const backup = { plan: biz.plan, exp: biz.planExpiresAt, courtesy: biz.planIsCourtesy }
  console.log(`📌 negócio: ${biz.name}\n`)

  const cfgs = await getPlanConfigs()
  const premiumCents = cfgs.PREMIUM.priceCents
  let claimId = ""

  try {
    // baseline limpo: negócio FORA do MRR antes de medir
    await db.business.update({ where: { id: biz.id }, data: { plan: "FREE", planExpiresAt: null, planIsCourtesy: false } })
    const receitaAntes = await receita()
    const mrrAntes = await mrr()

    // ── concede cortesia (replica a rota) ──
    const expiresAt = new Date(Date.now() + 30 * 864e5)
    await db.$transaction([
      db.business.update({ where: { id: biz.id }, data: { plan: "PREMIUM", planExpiresAt: expiresAt, planIsCourtesy: true } }),
      db.paymentClaim.create({ data: { businessId: biz.id, userId: biz.ownerId!, plan: "PREMIUM", method: "COURTESY", months: 1, amountCents: 0, status: "CONFIRMED", reviewedAt: new Date() } }),
    ])
    const created = await db.paymentClaim.findFirst({ where: { businessId: biz.id, method: "COURTESY" }, orderBy: { createdAt: "desc" } })
    claimId = created!.id

    const after = await db.business.findUnique({ where: { id: biz.id } })
    ok(after!.plan === "PREMIUM" && after!.planIsCourtesy, "cortesia ativou o plano Premium e marcou planIsCourtesy")
    ok((await receita()) === receitaAntes, "cortesia NÃO alterou o total recebido (receita intacta)")
    ok((await mrr()) === mrrAntes, "cortesia NÃO entrou no MRR")

    // ── converte para pago ──
    await db.$transaction([
      db.business.update({ where: { id: biz.id }, data: { planIsCourtesy: false } }),
      db.paymentClaim.update({ where: { id: claimId }, data: { method: "PIX", amountCents: 4790 } }),
    ])
    ok((await receita()) === receitaAntes + 4790, "após conversão para pago, receita sobe R$47,90")
    ok((await mrr()) === mrrAntes + premiumCents, "após conversão, negócio entra no MRR")

    // ── expiração limpa o flag (replica cron) ──
    await db.business.update({ where: { id: biz.id }, data: { plan: "FREE", planExpiresAt: null, planIsCourtesy: false } })
    const exp = await db.business.findUnique({ where: { id: biz.id } })
    ok(exp!.plan === "FREE" && !exp!.planIsCourtesy, "expiração rebaixa para FREE e limpa o flag")
  } finally {
    if (claimId) await db.paymentClaim.delete({ where: { id: claimId } }).catch(() => {})
    await db.business.update({ where: { id: biz.id }, data: { plan: backup.plan, planExpiresAt: backup.exp, planIsCourtesy: backup.courtesy } })
    await db.auditLog.deleteMany({ where: { action: "plan.courtesy_granted", entityId: biz.id } })
    console.log("\n♻️  Estado restaurado")
  }

  console.log(`\n${fail === 0 ? "🎉" : "⚠️ "} ${pass} passou, ${fail} falhou`)
  await db.$disconnect()
  process.exit(fail === 0 ? 0 : 1)
}
main().catch(e => { console.error(e); process.exit(1) })
