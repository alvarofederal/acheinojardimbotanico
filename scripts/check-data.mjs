import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

const total = await db.business.count()
const withPhotos = await db.photo.count()
const sample = await db.business.findMany({
  take: 8,
  select: { name: true, neighborhood: true, address: true, latitude: true, longitude: true, _count: { select: { photos: true } } },
})

console.log(`Negócios: ${total} | Fotos: ${withPhotos}\n`)
for (const b of sample) {
  console.log(`• ${b.name}`)
  console.log(`  bairro="${b.neighborhood}" fotos=${b._count.photos}`)
  console.log(`  ${b.address}`)
  console.log(`  (${b.latitude}, ${b.longitude})\n`)
}

// Distribuição por bairro
const byHood = await db.business.groupBy({ by: ["neighborhood"], _count: true })
console.log("Por bairro:")
byHood.sort((a,b)=>b._count-a._count).forEach(h => console.log(`  ${h._count}x  ${h.neighborhood}`))

await db.$disconnect()
