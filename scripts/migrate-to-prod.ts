/**
 * scripts/migrate-to-prod.ts
 * Copia dados selecionados de uma base (ORIGEM) para outra (DESTINO).
 *
 * O QUE COPIA: Categorias, Negócios, Fotos, Produtos + os 2 usuários mantidos
 * (admin e Arte e Tradição), preservando IDs e passwordHash.
 * O QUE NÃO COPIA: views, cliques, claims, sessões, tokens, pagamentos, presença,
 * demais usuários — tudo começa ZERADO no destino (marco zero do lançamento).
 *
 * SEGURANÇA:
 *  - Lê ORIGEM e DESTINO de SRC_DATABASE_URL / DST_DATABASE_URL (explícitos).
 *  - Aborta se forem iguais.
 *  - NUNCA apaga nada no destino — só insere (createMany skipDuplicates = idempotente).
 *  - Dry-run por padrão. Só grava com a flag --confirm.
 *
 * USO:
 *   npx tsx scripts/migrate-to-prod.ts            # simulação (não grava)
 *   npx tsx scripts/migrate-to-prod.ts --confirm  # grava no DESTINO
 */
import { PrismaClient } from "../src/generated/prisma"

const SRC = process.env.SRC_DATABASE_URL
const DST = process.env.DST_DATABASE_URL
const CONFIRM = process.argv.includes("--confirm")
const KEEP_EMAILS = ["admin@acheinojardimbotanico.com.br", "alvarofederal@gmail.com"]

function dbLabel(url: string) {
  const name = url.match(/\/([^/?]+)(\?|$)/)?.[1] ?? "?"
  const host = url.match(/@([^/]+)\//)?.[1] ?? "?"
  return `${name} @ ${host}`
}

async function copyChunked(label: string, rows: unknown[], create: (chunk: unknown[]) => Promise<{ count: number }>) {
  let total = 0
  for (let i = 0; i < rows.length; i += 200) {
    const r = await create(rows.slice(i, i + 200))
    total += r.count
  }
  console.log(`  ${label}: +${total}`)
}

async function main() {
  if (!SRC || !DST) {
    console.error("❌ Defina SRC_DATABASE_URL (dev) e DST_DATABASE_URL (prod) no .env")
    process.exit(1)
  }
  if (SRC === DST) {
    console.error("❌ ORIGEM e DESTINO são iguais — abortando por segurança.")
    process.exit(1)
  }

  const src = new PrismaClient({ datasources: { db: { url: SRC } } })
  const dst = new PrismaClient({ datasources: { db: { url: DST } } })

  console.log(`\n  ORIGEM : ${dbLabel(SRC)}`)
  console.log(`  DESTINO: ${dbLabel(DST)}`)
  console.log(CONFIRM ? "\n  MODO: GRAVAÇÃO (--confirm)\n" : "\n  MODO: SIMULAÇÃO (dry-run) — nada será gravado.\n")

  // 1) Lê da ORIGEM
  const [categories, keepUsers, businessesRaw, photos, products, planConfigs, paymentConfigs] = await Promise.all([
    src.category.findMany(),
    src.user.findMany({ where: { email: { in: KEEP_EMAILS } } }),
    src.business.findMany(),
    src.photo.findMany(),
    src.product.findMany(),
    src.planConfig.findMany(),
    src.paymentConfig.findMany(),
  ])

  const keepIds = new Set(keepUsers.map((u) => u.id))
  // Negócios cujo dono não será mantido voltam a ficar SEM dono (IMPORTED)
  const businesses = businessesRaw.map((b) =>
    b.ownerId && keepIds.has(b.ownerId) ? b : { ...b, ownerId: null, status: "IMPORTED" as const }
  )
  const orphaned = businessesRaw.length - businesses.filter((b) => b.ownerId).length

  console.log("  A copiar:")
  console.log(`    Categorias : ${categories.length}`)
  console.log(`    Usuários   : ${keepUsers.length} ${keepUsers.length ? `(${keepUsers.map((u) => u.email).join(", ")})` : "⚠️ NENHUM encontrado!"}`)
  console.log(`    Negócios   : ${businesses.length} (${orphaned} ficarão sem dono)`)
  console.log(`    Fotos      : ${photos.length}`)
  console.log(`    Produtos   : ${products.length}`)
  console.log(`    Config planos    : ${planConfigs.length}`)
  console.log(`    Config pagamento : ${paymentConfigs.length}`)

  if (!CONFIRM) {
    await src.$disconnect()
    await dst.$disconnect()
    console.log("\n  ✋ Dry-run encerrado. Rode com --confirm para gravar no DESTINO.\n")
    return
  }

  // 2) Grava no DESTINO (ordem lógica; só insere, nunca apaga)
  console.log("\n  Gravando...")
  await copyChunked("Categorias", categories, (c) => dst.category.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Usuários", keepUsers, (c) => dst.user.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Negócios", businesses, (c) => dst.business.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Fotos", photos, (c) => dst.photo.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Produtos", products, (c) => dst.product.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Config planos", planConfigs, (c) => dst.planConfig.createMany({ data: c as never, skipDuplicates: true }))
  await copyChunked("Config pagamento", paymentConfigs, (c) => dst.paymentConfig.createMany({ data: c as never, skipDuplicates: true }))

  await src.$disconnect()
  await dst.$disconnect()
  console.log("\n  ✅ Migração concluída.\n")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
