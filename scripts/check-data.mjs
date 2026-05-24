import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

const usage = await db.apiUsage.groupBy({ by: ["kind"], _sum: { units: true, costUsd: true } })
console.log("API Usage:")
let total = 0
for (const u of usage) { console.log(`  ${u.kind}: ${u._sum.units} chamadas, US$ ${u._sum.costUsd?.toFixed(2)}`); total += u._sum.costUsd ?? 0 }
console.log(`  TOTAL: US$ ${total.toFixed(2)} ≈ R$ ${(total * 5.3).toFixed(2)}`)

// amostra de review (idioma)
const b = await db.business.findFirst({ where: { NOT: { reviews: { equals: null } } }, select: { name: true, reviews: true } })
if (b) {
  const r = Array.isArray(b.reviews) ? b.reviews[0] : null
  console.log(`\nReview de "${b.name}":`)
  console.log(`  texto: ${r?.text?.text?.slice(0, 100) ?? "(sem)"}`)
  console.log(`  idioma: ${r?.text?.languageCode ?? "?"}`)
}
await db.$disconnect()
