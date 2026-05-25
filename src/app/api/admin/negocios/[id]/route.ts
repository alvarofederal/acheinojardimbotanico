export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({ action: z.enum(["approve", "reject"]) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true, status: true } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  const approve = v.data.action === "approve"
  await db.business.update({
    where: { id },
    data: { status: approve ? "CLAIMED" : "SUSPENDED" },
  })

  await logAudit({
    actorId: session.user.id,
    action: approve ? "business.approved" : "business.rejected",
    entity: "Business",
    entityId: id,
    businessId: id,
    metadata: { name: business.name },
  })

  return NextResponse.json({ ok: true })
}
