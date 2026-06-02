export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100).trim().optional(),
  role: z.enum(["VISITOR", "ADVERTISER", "ADMIN"]).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const v = patchSchema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Não permitir o admin rebaixar a própria conta (evita se trancar pra fora)
  if (id === session.user.id && v.data.role && v.data.role !== "ADMIN") {
    return NextResponse.json({ error: "Você não pode rebaixar sua própria conta" }, { status: 400 })
  }

  await db.user.update({ where: { id }, data: v.data })

  await logAudit({
    actorId: session.user.id,
    action: "user.updated",
    entity: "User",
    entityId: id,
    metadata: { ...v.data },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: "Você não pode excluir a própria conta por aqui" }, { status: 400 })
  }

  const target = await db.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Libera negócios que ele possuía (volta para não reivindicado, sem dono)
  await db.business.updateMany({
    where: { ownerId: id },
    data: { ownerId: null, status: "IMPORTED" },
  })

  // Remove dependências e o usuário (relationMode = prisma: limpamos na mão)
  await db.authToken.deleteMany({ where: { userId: id } })
  await db.session.deleteMany({ where: { userId: id } })
  await db.account.deleteMany({ where: { userId: id } })
  await db.claimRequest.deleteMany({ where: { userId: id } })
  await db.user.delete({ where: { id } })

  await logAudit({
    actorId: session.user.id,
    action: "user.deleted",
    entity: "User",
    entityId: id,
    metadata: { email: target.email },
  })

  return NextResponse.json({ ok: true })
}
