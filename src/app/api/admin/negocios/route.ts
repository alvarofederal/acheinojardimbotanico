export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { generateUniqueHandle } from "@/lib/handle-db"
import { logAudit } from "@/lib/audit"
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
  website: z.string().url().or(z.literal("")).optional(),
  instagram: z.string().max(60).optional(),
  description: z.string().max(1000).optional(),
  plan: z.enum(["FREE", "VISIBILITY", "PREMIUM"]).optional(),
  status: z.enum(["IMPORTED", "CLAIMED", "PENDING_REVIEW", "SUSPENDED"]).optional(),
})

/** Cadastro MANUAL de negócio pelo admin (sem passar pelo Google Places). */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const category = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true, slug: true } })
  if (!category) return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })

  const slug = `${slugify(d.name).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`
  const handle = await generateUniqueHandle(d.name)

  const business = await db.business.create({
    data: {
      slug, handle, name: d.name.trim(),
      categoryId: d.categoryId,
      description: d.description?.trim() || null,
      address: d.address.trim(),
      neighborhood: d.neighborhood?.trim() || "Jardim Botânico",
      city: d.city?.trim() || "Brasília",
      state: d.state?.trim() || "DF",
      latitude: d.latitude,
      longitude: d.longitude,
      phone: d.phone?.trim() || null,
      whatsapp: d.whatsapp?.trim() || null,
      website: d.website || null,
      instagram: d.instagram?.trim() || null,
      status: d.status ?? "IMPORTED",
      plan: d.plan ?? "FREE",
    },
  })

  await logAudit({ actorId: session.user.id, action: "business.created", entity: "Business", entityId: business.id, businessId: business.id, metadata: { name: business.name, source: "admin_manual" } })
  revalidatePath("/")
  revalidatePath(`/jardim-botanico/${category.slug}`)

  return NextResponse.json({ ok: true, businessId: business.id, handle })
}
