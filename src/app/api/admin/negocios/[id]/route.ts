export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({ action: z.enum(["approve", "reject", "activate", "deactivate"]) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

  const business = await db.business.findUnique({
    where: { id },
    select: { id: true, name: true, status: true, ownerId: true, slug: true, neighborhood: true, category: { select: { slug: true } }, owner: { select: { role: true } } },
  })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  const action = v.data.action

  // Aprovar / rejeitar (moderação de cadastro novo) — comportamento original
  if (action === "approve" || action === "reject") {
    const approve = action === "approve"
    await db.business.update({ where: { id }, data: { status: approve ? "CLAIMED" : "SUSPENDED" } })
    await logAudit({
      actorId: session.user.id,
      action: approve ? "business.approved" : "business.rejected",
      entity: "Business", entityId: id, businessId: id, metadata: { name: business.name },
    })
    return NextResponse.json({ ok: true })
  }

  // Ativar / desativar (LGPD / pedido do lojista) — cascata para o dono
  const deactivate = action === "deactivate"
  const newStatus = deactivate ? "SUSPENDED" : business.ownerId ? "CLAIMED" : "IMPORTED"

  // Trava: nunca desativa a conta de um ADMIN nem a do próprio admin logado
  const ownerProtected = !!business.ownerId && (business.ownerId === session.user.id || business.owner?.role === "ADMIN")

  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.business.update({ where: { id }, data: { status: newStatus } }),
  ]
  if (business.ownerId && !ownerProtected) {
    ops.push(db.user.update({ where: { id: business.ownerId }, data: { active: !deactivate } }))
    if (deactivate) ops.push(db.session.deleteMany({ where: { userId: business.ownerId } })) // logout imediato
  }
  await db.$transaction(ops)

  await logAudit({
    actorId: session.user.id,
    action: deactivate ? "business.deactivated" : "business.activated",
    entity: "Business", entityId: id, businessId: id,
    metadata: { name: business.name, ownerAffected: !!business.ownerId },
  })

  // Reflete imediatamente no site público (esconde/reexibe)
  const bairro = slugify(business.neighborhood)
  revalidatePath(`/${bairro}/${business.category.slug}/${business.slug}`)
  revalidatePath(`/${bairro}/${business.category.slug}`)
  revalidatePath("/")

  return NextResponse.json({ ok: true })
}
