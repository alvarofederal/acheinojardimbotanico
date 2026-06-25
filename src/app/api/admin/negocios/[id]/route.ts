export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const actionSchema = z.object({ action: z.enum(["approve", "reject", "activate", "deactivate"]) })

const fieldSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  categoryId: z.string().min(1).optional(),
  phone: z.string().max(40).nullable().optional(),
  whatsapp: z.string().max(40).nullable().optional(),
  website: z.string().url().or(z.literal("")).nullable().optional(),
  instagram: z.string().max(60).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  address: z.string().max(300).optional(),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(40).optional(),
  latitude: z.number().gte(-90).lte(90).optional(),
  longitude: z.number().gte(-180).lte(180).optional(),
  plan: z.enum(["FREE", "VISIBILITY", "PREMIUM"]).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // ── Branch 1: ações de moderação/status (comportamento original) ──
  if (body && typeof body.action === "string") {
    const v = actionSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

    const business = await db.business.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, ownerId: true, slug: true, handle: true, neighborhood: true, category: { select: { slug: true } }, owner: { select: { role: true } } },
    })
    if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })
    const action = v.data.action

    if (action === "approve" || action === "reject") {
      const approve = action === "approve"
      await db.business.update({ where: { id }, data: { status: approve ? "CLAIMED" : "SUSPENDED" } })
      await logAudit({ actorId: session.user.id, action: approve ? "business.approved" : "business.rejected", entity: "Business", entityId: id, businessId: id, metadata: { name: business.name } })
      return NextResponse.json({ ok: true })
    }

    const deactivate = action === "deactivate"
    const newStatus = deactivate ? "SUSPENDED" : business.ownerId ? "CLAIMED" : "IMPORTED"
    const ownerProtected = !!business.ownerId && (business.ownerId === session.user.id || business.owner?.role === "ADMIN")

    const ops: Prisma.PrismaPromise<unknown>[] = [db.business.update({ where: { id }, data: { status: newStatus } })]
    if (business.ownerId && !ownerProtected) {
      ops.push(db.user.update({ where: { id: business.ownerId }, data: { active: !deactivate } }))
      if (deactivate) ops.push(db.session.deleteMany({ where: { userId: business.ownerId } }))
    }
    await db.$transaction(ops)

    await logAudit({ actorId: session.user.id, action: deactivate ? "business.deactivated" : "business.activated", entity: "Business", entityId: id, businessId: id, metadata: { name: business.name, ownerAffected: !!business.ownerId } })

    const bairro = slugify(business.neighborhood)
    revalidatePath(`/${bairro}/${business.category.slug}/${business.slug}`)
    revalidatePath(`/${bairro}/${business.category.slug}`)
    revalidatePath("/")
    if (business.handle) revalidatePath(`/${business.handle}`)
    return NextResponse.json({ ok: true })
  }

  // ── Branch 2: edição de campos (admin) ──
  const v = fieldSchema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true, slug: true, handle: true, neighborhood: true, category: { select: { slug: true } } } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  if (d.categoryId) {
    const cat = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } })
    if (!cat) return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })
  }

  await db.business.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.categoryId !== undefined ? { categoryId: d.categoryId } : {}),
      ...(d.phone !== undefined ? { phone: d.phone?.trim() || null } : {}),
      ...(d.whatsapp !== undefined ? { whatsapp: d.whatsapp?.trim() || null } : {}),
      ...(d.website !== undefined ? { website: d.website || null } : {}),
      ...(d.instagram !== undefined ? { instagram: d.instagram?.trim() || null } : {}),
      ...(d.description !== undefined ? { description: d.description?.trim() || null } : {}),
      ...(d.address !== undefined ? { address: d.address.trim() } : {}),
      ...(d.neighborhood !== undefined ? { neighborhood: d.neighborhood.trim() } : {}),
      ...(d.city !== undefined ? { city: d.city.trim() } : {}),
      ...(d.state !== undefined ? { state: d.state.trim() } : {}),
      ...(d.latitude !== undefined ? { latitude: d.latitude } : {}),
      ...(d.longitude !== undefined ? { longitude: d.longitude } : {}),
      ...(d.plan !== undefined ? { plan: d.plan } : {}),
    },
  })

  await logAudit({ actorId: session.user.id, action: "business.updated", entity: "Business", entityId: id, businessId: id, metadata: { name: d.name ?? business.name } })

  // Revalida o perfil (curto + longo) e as listagens (categoria pode ter mudado)
  revalidatePath("/")
  if (business.handle) revalidatePath(`/${business.handle}`)
  revalidatePath(`/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}`)
  revalidatePath(`/${slugify(business.neighborhood)}/${business.category.slug}`)

  return NextResponse.json({ ok: true })
}
