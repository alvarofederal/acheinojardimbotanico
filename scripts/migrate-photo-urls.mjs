import { PrismaClient } from "../src/generated/prisma/index.js"
const db = new PrismaClient()

// Converte URLs antigas (Google media com chave) → caminho do proxy interno.
// https://places.googleapis.com/v1/places/X/photos/Y/media?... → /api/photo/places/X/photos/Y
const photos = await db.photo.findMany({ select: { id: true, url: true } })
let migrated = 0, skipped = 0

for (const p of photos) {
  if (p.url.startsWith("/api/photo/")) { skipped++; continue }
  const m = p.url.match(/\/v1\/(places\/[^/]+\/photos\/[^/?]+)/)
  if (!m) { skipped++; continue }
  await db.photo.update({ where: { id: p.id }, data: { url: `/api/photo/${m[1]}` } })
  migrated++
}

console.log(`Migradas: ${migrated} | Inalteradas: ${skipped} | Total: ${photos.length}`)
await db.$disconnect()
