import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()
const total = await db.photo.count()
const all = await db.photo.findMany({ select: { url: true } })
const proxied = all.filter(p => p.url.startsWith("/api/photo/")).length
console.log(`Fotos: ${total} | proxy: ${proxied} | antigas: ${total - proxied}`)
console.log("Exemplo:", all[0]?.url)
await db.$disconnect()
