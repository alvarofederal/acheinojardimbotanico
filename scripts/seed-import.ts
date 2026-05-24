/**
 * scripts/seed-import.ts
 * Importa negócios reais do Google Places diretamente no banco (bypassa a rota HTTP/auth).
 * Valida o pipeline da Spec 001 ponta a ponta e popula o ambiente de dev.
 *
 * Uso: node_modules/.bin/tsx scripts/seed-import.ts [raio_m] [max_por_tipo]
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/index.js"
import {
  searchNearby,
  searchText,
  getPhotoUrl,
  extractNeighborhood,
  generateSlug,
  CATEGORY_MAP,
  PLACE_TYPES_TO_IMPORT,
} from "../src/lib/places"

// Negócios menores / sem tipo — buscados por texto (Google Meu Negócio)
const TEXT_QUERIES = [
  "Arte e Tradição Jardim Botânico",
  "artesanato Jardim Botânico Brasília",
  "doces caseiros Jardim Botânico",
  "ateliê Jardim Botânico Brasília",
  "MEI Jardim Botânico Brasília",
]

const db = new PrismaClient()

// Centro do BAIRRO Jardim Botânico (DF) — Comércio do JB, ao lado do Lago Sul.
// NÃO confundir com o Parque/Jardim Botânico (atração) nem com o Aeroporto.
// Coordenadas do place oficial no Google Maps.
const LAT = -15.8794145
const LNG = -47.8105738
const RADIUS = Number(process.argv[2] ?? 3000)
const MAX_PER_TYPE = Number(process.argv[3] ?? 10)
const CLEAR = process.argv.includes("--clear")

async function main() {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error("❌ GOOGLE_PLACES_API_KEY não configurada no .env")
    process.exit(1)
  }

  let imported = 0
  let updated = 0
  let errors = 0

  if (CLEAR) {
    // Só limpa negócios NÃO reivindicados (preserva os que têm dono)
    const del = await db.business.deleteMany({ where: { ownerId: null } })
    console.log(`🧹 Limpos ${del.count} negócios não reivindicados\n`)
  }

  console.log(`🔎 Importando do bairro Jardim Botânico (raio ${RADIUS}m, até ${MAX_PER_TYPE}/tipo)`)
  console.log(`   centro: ${LAT}, ${LNG}\n`)

  for (const placeType of PLACE_TYPES_TO_IMPORT) {
    let places
    try {
      places = await searchNearby({ lat: LAT, lng: LNG, radiusMeters: RADIUS, placeType, maxResults: MAX_PER_TYPE })
    } catch (e) {
      console.error(`  ⚠️  ${placeType}: ${e instanceof Error ? e.message : e}`)
      errors++
      continue
    }

    if (places.length === 0) continue
    process.stdout.write(`  ${placeType}: ${places.length} `)

    for (const place of places) {
      try {
        const cat = CATEGORY_MAP[placeType] ?? { slug: "outros", name: "Outros" }
        const category = await db.category.upsert({
          where: { slug: cat.slug },
          create: { slug: cat.slug, name: cat.name },
          update: {},
        })

        const name = place.displayName.text
        const neighborhood = extractNeighborhood(place.formattedAddress)
        const existing = await db.business.findUnique({ where: { placeId: place.id } })

        if (existing) {
          await db.business.update({
            where: { id: existing.id },
            data: {
              name, address: place.formattedAddress, neighborhood,
              latitude: place.location.latitude, longitude: place.location.longitude,
              phone: place.nationalPhoneNumber ?? existing.phone,
              website: place.websiteUri ?? existing.website,
              googleRating: place.rating ?? existing.googleRating,
              googleRatingCount: place.userRatingCount ?? existing.googleRatingCount,
              lastSyncedAt: new Date(),
            },
          })
          updated++
        } else {
          const created = await db.business.create({
            data: {
              placeId: place.id,
              slug: generateSlug(name, place.id),
              name,
              categoryId: category.id,
              description: place.editorialSummary?.text ?? null,
              address: place.formattedAddress,
              neighborhood, city: "Brasília", state: "DF",
              latitude: place.location.latitude, longitude: place.location.longitude,
              phone: place.nationalPhoneNumber ?? null,
              website: place.websiteUri ?? null,
              googleRating: place.rating ?? null,
              googleRatingCount: place.userRatingCount ?? null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              openingHours: (place.regularOpeningHours ?? undefined) as any,
              status: "IMPORTED", plan: "FREE", lastSyncedAt: new Date(),
            },
          })

          if (place.photos?.length) {
            await db.photo.createMany({
              data: place.photos.slice(0, 5).map((p, i) => ({
                businessId: created.id,
                url: getPhotoUrl(p.name, 800),
                width: p.widthPx ?? null,
                height: p.heightPx ?? null,
                source: "GOOGLE_PLACES" as const,
                order: i,
              })),
            })
          }
          imported++
        }
      } catch (e) {
        errors++
        console.error(`\n    ✗ ${place.displayName?.text}: ${e instanceof Error ? e.message : e}`)
      }
    }
    process.stdout.write("✓\n")
  }

  // Busca por texto — negócios menores
  for (const query of TEXT_QUERIES) {
    let places
    try {
      places = await searchText({ textQuery: query, lat: LAT, lng: LNG, radiusMeters: RADIUS, maxResults: MAX_PER_TYPE })
    } catch (e) {
      console.error(`  ⚠️  texto "${query}": ${e instanceof Error ? e.message : e}`)
      errors++
      continue
    }
    if (!places.length) continue
    process.stdout.write(`  texto "${query}": ${places.length} `)
    for (const place of places) {
      try {
        const mapped = place.primaryType ? CATEGORY_MAP[place.primaryType] : undefined
        const cat = mapped ?? { slug: "outros", name: "Outros" }
        const category = await db.category.upsert({
          where: { slug: cat.slug }, create: { slug: cat.slug, name: cat.name }, update: {},
        })
        const name = place.displayName.text
        const existing = await db.business.findUnique({ where: { placeId: place.id } })
        if (existing) { updated++; continue }
        const created = await db.business.create({
          data: {
            placeId: place.id, slug: generateSlug(name, place.id), name, categoryId: category.id,
            description: place.editorialSummary?.text ?? null,
            address: place.formattedAddress, neighborhood: extractNeighborhood(place.formattedAddress),
            city: "Brasília", state: "DF",
            latitude: place.location.latitude, longitude: place.location.longitude,
            phone: place.nationalPhoneNumber ?? null, website: place.websiteUri ?? null,
            googleRating: place.rating ?? null, googleRatingCount: place.userRatingCount ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            openingHours: (place.regularOpeningHours ?? undefined) as any,
            status: "IMPORTED", plan: "FREE", lastSyncedAt: new Date(),
          },
        })
        if (place.photos?.length) {
          await db.photo.createMany({ data: place.photos.slice(0, 5).map((p, i) => ({
            businessId: created.id, url: getPhotoUrl(p.name, 800),
            width: p.widthPx ?? null, height: p.heightPx ?? null, source: "GOOGLE_PLACES" as const, order: i,
          })) })
        }
        imported++
      } catch { errors++ }
    }
    process.stdout.write("✓\n")
  }

  const total = await db.business.count()
  console.log(`\n✅ Concluído: ${imported} novos, ${updated} atualizados, ${errors} erros`)
  console.log(`📊 Total de negócios no banco: ${total}`)
  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
