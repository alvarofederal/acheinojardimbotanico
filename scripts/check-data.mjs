import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

const total = await db.business.count()
const photos = await db.photo.count()
const withReviews = await db.business.count({ where: { NOT: { reviews: { equals: null } } } })
const sample = await db.business.findMany({
  where: { name: { contains: "Arte e Tradi" } },
  select: { name: true, reviews: true, _count: { select: { photos: true } } },
})

console.log(`Negócios: ${total}`)
console.log(`Fotos totais: ${photos}`)
console.log(`Negócios com reviews: ${withReviews}`)
if (sample[0]) {
  const r = sample[0].reviews
  console.log(`\nArte e Tradição: fotos=${sample[0]._count.photos}, reviews=${Array.isArray(r) ? r.length : 0}`)
}
await db.$disconnect()
