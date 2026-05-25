/**
 * Teste do cron de expiração de planos.
 * Marca um negócio como pago-vencido e outro como pago-vigente, chama o
 * endpoint /api/cron/expirar-planos e confirma que só o vencido cai para FREE.
 * Restaura ambos no fim.
 *
 * Pré-requisito: server rodando (npm run dev). Uso: node_modules/.bin/tsx scripts/test-expire-plans.ts
 */
import "dotenv/config"
import { db } from "../src/lib/prisma"

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000"
let pass = 0, fail = 0
const ok = (b: boolean, msg: string) => { console.log(`${b ? "✅" : "❌"} ${msg}`); b ? pass++ : fail++ }

async function main() {
  console.log("🧪 Teste — cron de expiração de planos\n")

  const [vencido, vigente] = await db.business.findMany({
    where: { status: { in: ["IMPORTED", "CLAIMED"] } }, take: 2,
  })
  if (!vencido || !vigente) { console.error("Preciso de ao menos 2 negócios no banco"); process.exit(1) }

  const backup = [
    { id: vencido.id, plan: vencido.plan, exp: vencido.planExpiresAt },
    { id: vigente.id, plan: vigente.plan, exp: vigente.planExpiresAt },
  ]

  try {
    // vencido: Visibilidade que venceu ontem
    await db.business.update({ where: { id: vencido.id }, data: { plan: "VISIBILITY", planExpiresAt: new Date(Date.now() - 864e5) } })
    // vigente: Premium que vence amanhã (controle — NÃO pode ser tocado)
    await db.business.update({ where: { id: vigente.id }, data: { plan: "PREMIUM", planExpiresAt: new Date(Date.now() + 864e5) } })
    console.log(`📌 vencido=${vencido.name} | vigente(controle)=${vigente.name}\n`)

    const res = await fetch(`${BASE}/api/cron/expirar-planos`)
    const json = await res.json() as { ok: boolean; checked: number; downgraded: number }
    ok(res.status === 200, `endpoint respondeu 200 (checados=${json.checked}, rebaixados=${json.downgraded})`)

    const afterVencido = await db.business.findUnique({ where: { id: vencido.id } })
    const afterVigente = await db.business.findUnique({ where: { id: vigente.id } })

    ok(afterVencido!.plan === "FREE", "plano vencido foi rebaixado para FREE")
    ok(afterVencido!.planExpiresAt === null, "planExpiresAt do vencido foi zerado")
    ok(afterVigente!.plan === "PREMIUM", "plano vigente (controle) NÃO foi tocado")
    ok(afterVigente!.planExpiresAt !== null, "planExpiresAt do vigente preservado")

    // idempotência: rodar de novo não muda nada
    const res2 = await fetch(`${BASE}/api/cron/expirar-planos`)
    const json2 = await res2.json() as { downgraded: number }
    ok(json2.downgraded === 0, "2ª execução não rebaixa nada (idempotente)")
  } finally {
    for (const b of backup) {
      await db.business.update({ where: { id: b.id }, data: { plan: b.plan, planExpiresAt: b.exp } })
    }
    // limpa os AuditLog de teste
    await db.auditLog.deleteMany({ where: { action: "PLAN_EXPIRED", entityId: { in: backup.map(b => b.id) } } })
    console.log("\n♻️  Negócios e auditoria restaurados")
  }

  console.log(`\n${fail === 0 ? "🎉" : "⚠️ "} Resultado: ${pass} passou, ${fail} falhou`)
  await db.$disconnect()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
