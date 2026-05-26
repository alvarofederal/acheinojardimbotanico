export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import { type PlanId } from "@/lib/plans"
import { productLimit } from "@/lib/plan-config"
import { z } from "zod"

const variationSchema = z.object({ nome: z.string().max(40), opcoes: z.array(z.string().max(40)).max(20) })

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  categoria: z.string().max(60).optional(),
  priceMode: z.enum(["FIXED", "FROM", "ON_REQUEST"]).default("FIXED"),
  priceCents: z.number().int().min(0).max(100_000_00).optional(),
  promoPriceCents: z.number().int().min(0).max(100_000_00).nullable().optional(),
  images: z.array(z.string().url()).max(4).default([]),
  variations: z.array(variationSchema).max(6).default([]),
  soldOut: z.boolean().default(false),
  featured: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const limit = await productLimit(business.plan as PlanId)
  const count = await db.product.count({ where: { businessId: business.id } })
  if (count >= limit) {
    return NextResponse.json(
      { error: `Limite de ${limit} produtos atingido no plano ${business.plan}. Faça upgrade para adicionar mais.` },
      { status: 403 }
    )
  }

  const d = v.data
  const maxOrder = await db.product.aggregate({ where: { businessId: business.id }, _max: { order: true } })

  const product = await db.product.create({
    data: {
      businessId: business.id,
      name: d.name,
      description: d.description || null,
      categoria: d.categoria || null,
      priceMode: d.priceMode,
      priceCents: d.priceMode === "ON_REQUEST" ? null : (d.priceCents ?? 0),
      promoPriceCents: d.priceMode === "ON_REQUEST" ? null : (d.promoPriceCents ?? null),
      images: d.images as unknown as Prisma.InputJsonValue,
      variations: d.variations.length ? (d.variations as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      soldOut: d.soldOut,
      featured: d.featured,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  return NextResponse.json({ product })
}
