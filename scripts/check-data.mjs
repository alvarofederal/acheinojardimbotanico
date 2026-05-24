import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

const total = await db.business.count()
const cats = await db.category.count()
const photos = await db.photo.count()
console.log(`Negócios: ${total} | Categorias: ${cats} | Fotos: ${photos}`)

const churrasco = await db.business.findMany({
  where: { name: { contains: "Churrasco na Barca" } },
  select: { name: true, category: { select: { name: true } } },
})
console.log("\nChurrasco na Barca:", churrasco.length ? churrasco.map(c => `${c.name} (${c.category.name})`) : "NÃO ENCONTRADO")

// top categorias por nº de negócios
const top = await db.category.findMany({
  select: { name: true, _count: { select: { businesses: true } } },
  orderBy: { businesses: { _count: "desc" } }, take: 12,
})
console.log("\nTop categorias:")
top.forEach(c => console.log(`  ${c._count.businesses}x  ${c.name}`))

const usage = await db.apiUsage.aggregate({ _sum: { costUsd: true } })
console.log(`\nCusto acumulado: US$ ${usage._sum.costUsd?.toFixed(2)} ≈ R$ ${((usage._sum.costUsd ?? 0) * 5.3).toFixed(2)}`)
await db.$disconnect()
