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
  getPhotoUrl,
  extractNeighborhood,
  generateSlug,
  CATEGORY_MAP,
  PLACE_TYPES_TO_IMPORT,
} from "@/lib/places"
import { z } from "zod"

const importSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(100).max(10000).default(3000),
  types: z
    .array(z.string())
    .min(1)
    .default([...PLACE_TYPES_TO_IMPORT]),
  maxPerType: z.number().min(1).max(20).default(20),
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

  const { lat, lng, radiusMeters, types, maxPerType } = validation.data

  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ name: string; status: string; error?: string }>,
  }

  for (const placeType of types) {
    let places
    try {
      places = await searchNearby({ lat, lng, radiusMeters, placeType, maxResults: maxPerType })
    } catch (err) {
      results.errors++
      results.details.push({
        name: `[batch: ${placeType}]`,
        status: "error",
        error: err instanceof Error ? err.message : "Erro na API",
      })
      continue
    }

    for (const place of places) {
      try {
        // Resolve categoria
        const categoryInfo = CATEGORY_MAP[placeType] ?? {
          slug: "outros",
          name: "Outros",
        }

        // Upsert categoria
        const category = await db.category.upsert({
          where: { slug: categoryInfo.slug },
          create: { slug: categoryInfo.slug, name: categoryInfo.name },
          update: {},
        })

        const name = place.displayName.text
        const neighborhood = extractNeighborhood(place.formattedAddress)

        // Verifica se já existe pelo placeId
        const existing = await db.business.findUnique({
          where: { placeId: place.id },
        })

        if (existing) {
          // Atualiza dados do Google
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
              lastSyncedAt: new Date(),
            },
          })
          results.updated++
          results.details.push({ name, status: "updated" })
        } else {
          // Cria novo negócio
          const slug = generateSlug(name, place.id)

          const created = await db.business.create({
            data: {
              placeId: place.id,
              slug,
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
              status: "IMPORTED",
              plan: "FREE",
              lastSyncedAt: new Date(),
            },
          })

          // Persiste até 5 fotos (URL direta do Google Places — exibição apenas)
          if (place.photos?.length) {
            const photos = place.photos.slice(0, 5).map((p, i) => ({
              businessId: created.id,
              url: getPhotoUrl(p.name, 800),
              width: p.widthPx ?? null,
              height: p.heightPx ?? null,
              source: "GOOGLE_PLACES" as const,
              order: i,
            }))
            await db.photo.createMany({ data: photos })
          }

          results.imported++
          results.details.push({ name, status: "imported" })
        }
      } catch (err) {
        results.errors++
        results.details.push({
          name: place.displayName?.text ?? place.id,
          status: "error",
          error: err instanceof Error ? err.message : "Erro desconhecido",
        })
      }
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "business.import",
      entity: "Business",
      entityId: "batch",
      metadata: {
        lat,
        lng,
        radiusMeters,
        types,
        ...results,
        details: undefined, // não logar linha a linha
      },
    },
  })

  return NextResponse.json(results)
}
