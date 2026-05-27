/**
 * Migração em massa das fotos do Google → Cloudinary (OPCIONAL).
 * A auto-cura do proxy já migra sob demanda; este script "pré-aquece" tudo,
 * útil antes de um pico de tráfego. Cada foto custa Google 1x (Place Photo).
 *
 * Uso:
 *   node_modules/.bin/tsx scripts/migrate-photos-cloudinary.ts            (dry-run: só mostra)
 *   node_modules/.bin/tsx scripts/migrate-photos-cloudinary.ts --go --limit 20   (migra 20)
 *   node_modules/.bin/tsx scripts/migrate-photos-cloudinary.ts --go             (migra tudo)
 */
import "dotenv/config"
import { db } from "../src/lib/prisma"
import { resolveGooglePhotoUri } from "../src/lib/places"
import { uploadToCloudinary, publicIdFromPhotoName, isCloudinaryUrl } from "../src/lib/cloudinary"

const args = process.argv.slice(2)
const GO = args.includes("--go")
const limitArg = args.find(a => a.startsWith("--limit"))
const LIMIT = limitArg ? parseInt(limitArg.split(/[ =]/)[1] || args[args.indexOf("--limit") + 1] || "0", 10) : 0

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  // Fotos do Google que ainda apontam pro proxy (não migradas)
  const all = await db.photo.findMany({
    where: { source: "GOOGLE_PLACES", url: { startsWith: "/api/photo/" } },
    select: { id: true, url: true },
    orderBy: { businessId: "asc" },
  })
  const pending = all.filter(p => !isCloudinaryUrl(p.url))
  const targets = LIMIT > 0 ? pending.slice(0, LIMIT) : pending

  console.log(`📷 ${pending.length} fotos pendentes de migração.`)
  console.log(`${GO ? "🚀 Migrando" : "🔍 DRY-RUN (use --go para executar)"} ${targets.length} foto(s).`)
  if (!GO) { console.log("Estimativa de custo Google: ~US$0.007 por foto, uma única vez."); process.exit(0) }

  let ok = 0, fail = 0
  for (const [i, photo] of targets.entries()) {
    const photoName = photo.url.replace(/^\/api\/photo\//, "")
    try {
      const uri = await resolveGooglePhotoUri(photoName, 1600)
      if (!uri) { fail++; console.log(`  ✖ [${i + 1}] sem URI`); continue }
      const secure = await uploadToCloudinary(uri, publicIdFromPhotoName(photoName))
      await db.photo.update({ where: { id: photo.id }, data: { url: secure } })
      ok++
      if ((i + 1) % 25 === 0) console.log(`  ... ${i + 1}/${targets.length}`)
    } catch (e) {
      fail++; console.error(`  ✖ [${i + 1}]`, (e as Error).message)
    }
    await sleep(120) // respira entre chamadas
  }

  console.log(`\n✅ Migradas: ${ok} | ❌ Falhas: ${fail}`)
  await db.$disconnect()
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
