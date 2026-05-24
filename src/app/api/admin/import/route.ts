/**
 * POST /api/admin/import
 * Importa negócios do Google Places para o banco do Achei.
 * Apenas ADMIN pode chamar.
 */
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import {
  searchNearby,
  searchText,
  getPhotoProxyPath,
  extractNeighborhood,
  generateSlug,
  CATEGORY_MAP,
  PLACE_TYPES_TO_IMPORT,
  type PlaceResult,
} from "@/lib/places"
import { costUsd } from "@/lib/api-costs"
import { z } from "zod"

const importSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(100).max(10000).default(3000),
  types: z.array(z.string()).default([...PLACE_TYPES_TO_IMPORT]),
  maxPerType: z.number().min(1).max(20).default(20),
  // Termos de busca livre p/ negócios menores (ateliês, MEIs em casa, etc.)
  textQueries: z.array(z.string().min(2)).default([]),
})

export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // Validação
  const body = await request.json()
  const validation = importSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    )
  }

  const { lat, lng, radiusMeters, types, maxPerType, textQueries } = validation.data

  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ name: string; status: string; error?: string }>,
  }

  // Persiste um lugar do Google (cria ou atualiza). Reutilizado por tipo e texto.
  async function persistPlace(place: PlaceResult, categorySlug: string, categoryName: string) {
    const category = await db.category.upsert({
      where: { slug: categorySlug },
      create: { slug: categorySlug, name: categoryName },
      update: {},
    })

    const name = place.displayName.text
    const neighborhood = extractNeighborhood(place.formattedAddress)
    const existing = await db.business.findUnique({ where: { placeId: place.id } })

    if (existing) {
      await db.business.update({
        where: { id: existing.id },
        data: {
          name,
          address: place.formattedAddress,
          neighborhood,
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          phone: place.nationalPhoneNumber ?? existing.phone,
          website: place.websiteUri ?? existing.website,
          googleRating: place.rating ?? existing.googleRating,
          googleRatingCount: place.userRatingCount ?? existing.googleRatingCount,
          openingHours: place.regularOpeningHours
            ? (place.regularOpeningHours as Prisma.InputJsonValue)
            : existing.openingHours ?? Prisma.DbNull,
          reviews: place.reviews?.length
            ? (place.reviews.slice(0, 5) as unknown as Prisma.InputJsonValue)
            : existing.reviews ?? Prisma.DbNull,
          lastSyncedAt: new Date(),
        },
      })
      results.updated++
      results.details.push({ name, status: "updated" })
    } else {
      const created = await db.business.create({
        data: {
          placeId: place.id,
          slug: generateSlug(name, place.id),
          name,
          categoryId: category.id,
          description: place.editorialSummary?.text ?? null,
          address: place.formattedAddress,
          neighborhood,
          city: "Brasília",
          state: "DF",
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          phone: place.nationalPhoneNumber ?? null,
          website: place.websiteUri ?? null,
          googleRating: place.rating ?? null,
          googleRatingCount: place.userRatingCount ?? null,
          openingHours: place.regularOpeningHours
            ? (place.regularOpeningHours as Prisma.InputJsonValue)
            : Prisma.DbNull,
          reviews: place.reviews?.length
            ? (place.reviews.slice(0, 5) as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          status: "IMPORTED",
          plan: "FREE",
          lastSyncedAt: new Date(),
        },
      })

      if (place.photos?.length) {
        await db.photo.createMany({
          data: place.photos.slice(0, 5).map((p, i) => ({
            businessId: created.id,
            url: getPhotoProxyPath(p.name),
            width: p.widthPx ?? null,
            height: p.heightPx ?? null,
            source: "GOOGLE_PLACES" as const,
            order: i,
          })),
        })
      }
      results.imported++
      results.details.push({ name, status: "imported" })
    }
  }

  // 1) Busca por tipo (Nearby Search)
  for (const placeType of types) {
    let places: PlaceResult[]
    try {
      places = await searchNearby({ lat, lng, radiusMeters, placeType, maxResults: maxPerType })
    } catch (err) {
      results.errors++
      results.details.push({ name: `[tipo: ${placeType}]`, status: "error", error: err instanceof Error ? err.message : "Erro na API" })
      continue
    }
    await db.apiUsage.create({ data: { kind: "NEARBY", units: 1, results: places.length, costUsd: costUsd("NEARBY"), query: placeType } })
    const cat = CATEGORY_MAP[placeType] ?? { slug: "outros", name: "Outros" }
    for (const place of places) {
      try { await persistPlace(place, cat.slug, cat.name) }
      catch (err) {
        results.errors++
        results.details.push({ name: place.displayName?.text ?? place.id, status: "error", error: err instanceof Error ? err.message : "Erro" })
      }
    }
  }

  // 2) Busca por texto (negócios menores / sem tipo)
  for (const query of textQueries) {
    let places: PlaceResult[]
    try {
      places = await searchText({ textQuery: query, lat, lng, radiusMeters, maxResults: maxPerType })
    } catch (err) {
      results.errors++
      results.details.push({ name: `[texto: ${query}]`, status: "error", error: err instanceof Error ? err.message : "Erro na API" })
      continue
    }
    await db.apiUsage.create({ data: { kind: "TEXT", units: 1, results: places.length, costUsd: costUsd("TEXT"), query } })
    for (const place of places) {
      try {
        // Categoria inferida do primaryType, senão "outros"
        const mapped = place.primaryType ? CATEGORY_MAP[place.primaryType] : undefined
        const cat = mapped ?? { slug: "outros", name: "Outros" }
        await persistPlace(place, cat.slug, cat.name)
      } catch (err) {
        results.errors++
        results.details.push({ name: place.displayName?.text ?? place.id, status: "error", error: err instanceof Error ? err.message : "Erro" })
      }
    }
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "business.import",
      entity: "Business",
      entityId: "batch",
      metadata: { lat, lng, radiusMeters, types, textQueries, imported: results.imported, updated: results.updated, errors: results.errors },
    },
  })

  return NextResponse.json(results)
}
