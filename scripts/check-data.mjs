import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

const total = await db.business.count()
const cats = await db.category.count()
console.log(`Negócios: ${total} | Categorias: ${cats}`)

const ayres = await db.business.findMany({
  where: { name: { contains: "AyresMed" } },
  select: { name: true, neighborhood: true, _count: { select: { photos: true } }, category: { select: { name: true } } },
})
console.log("\nAyresMed:", ayres.length ? ayres.map(a => `${a.name} (${a.category.name}, ${a._count.photos} fotos)`) : "NÃO ENCONTRADO")

const usage = await db.apiUsage.aggregate({ _sum: { costUsd: true, units: true } })
console.log(`\nCusto acumulado: US$ ${usage._sum.costUsd?.toFixed(2)} (${usage._sum.units} chamadas) ≈ R$ ${((usage._sum.costUsd ?? 0) * 5.3).toFixed(2)}`)
await db.$disconnect()
