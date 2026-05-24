import "dotenv/config"
import { searchText, PLACE_TYPES_TO_IMPORT } from "../src/lib/places"
import { PrismaClient } from "../src/generated/prisma/index.js"

const db = new PrismaClient()
const LAT = -15.8794145, LNG = -47.8105738

async function main() {
  const queries = ["CHURRASCO NA BARCA POR ANDRE COSTA", "Churrasco na Barca Jardim Botânico"]
  const known = new Set<string>(PLACE_TYPES_TO_IMPORT)
  for (const q of queries) {
    console.log(`\n🔎 "${q}"`)
    try {
      const places = await searchText({ textQuery: q, lat: LAT, lng: LNG, radiusMeters: 6000, maxResults: 5 })
      if (!places.length) { console.log("  (nenhum resultado)"); continue }
      for (const p of places) {
        const inDb = await db.business.findUnique({ where: { placeId: p.id }, select: { id: true } })
        console.log(`  • ${p.displayName.text}`)
        console.log(`    primaryType=${p.primaryType ?? "?"} | no banco=${inDb ? "SIM" : "NÃO"} | tipo conhecido=${p.primaryType && known.has(p.primaryType) ? "SIM" : "NÃO"}`)
        console.log(`    ${p.formattedAddress}`)
      }
    } catch (e) { console.log("  ERRO:", e instanceof Error ? e.message : e) }
  }
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
