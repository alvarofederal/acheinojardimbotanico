export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { sendBusinessSubmittedEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(120),
  categoryId: z.string().min(1),
  address: z.string().min(5).max(300),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(40).optional(),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  description: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  // Um anunciante gerencia um negócio no painel — evita duplicar
  const existing = await db.business.findFirst({ where: { ownerId: session.user.id }, select: { id: true } })
  if (existing) return NextResponse.json({ error: "Você já tem um negócio vinculado à sua conta." }, { status: 409 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const category = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } })
  if (!category) return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })

  const slug = `${slugify(d.name).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`

  const business = await db.business.create({
    data: {
      slug,
      name: d.name,
      categoryId: d.categoryId,
      description: d.description || null,
      address: d.address,
      neighborhood: d.neighborhood?.trim() || "Jardim Botânico",
      city: d.city?.trim() || "Brasília",
      state: d.state?.trim() || "DF",
      latitude: d.latitude,
      longitude: d.longitude,
      phone: d.phone || null,
      whatsapp: d.whatsapp || null,
      status: "PENDING_REVIEW",
      plan: "FREE",
      ownerId: session.user.id,
    },
  })

  await logAudit({
    actorId: session.user.id,
    action: "business.created",
    entity: "Business",
    entityId: business.id,
    businessId: business.id,
    metadata: { name: business.name, source: "self_register" },
  })

  // Notifica admins para moderação (best-effort)
  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })
    await Promise.all(admins.filter(a => a.email).map(a => sendBusinessSubmittedEmail(a.email!, business.name)))
  } catch { /* email é best-effort */ }

  return NextResponse.json({ ok: true, businessId: business.id })
}
