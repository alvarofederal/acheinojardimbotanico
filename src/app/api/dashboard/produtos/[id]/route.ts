export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import { z } from "zod"

const variationSchema = z.object({ nome: z.string().max(40), opcoes: z.array(z.string().max(40)).max(20) })

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  categoria: z.string().max(60).optional(),
  priceMode: z.enum(["FIXED", "FROM", "ON_REQUEST"]).optional(),
  priceCents: z.number().int().min(0).max(100_000_00).optional(),
  promoPriceCents: z.number().int().min(0).max(100_000_00).nullable().optional(),
  images: z.array(z.string().url()).max(4).optional(),
  variations: z.array(variationSchema).max(6).optional(),
  soldOut: z.boolean().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
})

async function ownerProduct(userId: string, id: string) {
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return null
  const business = await db.business.findFirst({ where: { ownerId: userId } })
  if (!business || product.businessId !== business.id) return null
  return product
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params

  const product = await ownerProduct(session.user.id, id)
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  await db.product.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.categoria !== undefined ? { categoria: d.categoria || null } : {}),
      ...(d.priceMode !== undefined ? { priceMode: d.priceMode, priceCents: d.priceMode === "ON_REQUEST" ? null : (d.priceCents ?? product.priceCents ?? 0) } : (d.priceCents !== undefined ? { priceCents: d.priceCents } : {})),
      ...(d.promoPriceCents !== undefined ? { promoPriceCents: d.promoPriceCents } : {}),
      ...(d.images !== undefined ? { images: d.images as unknown as Prisma.InputJsonValue } : {}),
      ...(d.variations !== undefined ? { variations: d.variations.length ? (d.variations as unknown as Prisma.InputJsonValue) : Prisma.DbNull } : {}),
      ...(d.soldOut !== undefined ? { soldOut: d.soldOut } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params

  const product = await ownerProduct(session.user.id, id)
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })

  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
