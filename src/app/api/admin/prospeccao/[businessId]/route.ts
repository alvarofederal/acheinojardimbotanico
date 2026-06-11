export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  contacted: z.boolean().optional(),          // compat: true = D0, false = reset do ciclo
  touch: z.enum(["d0", "d3", "d7"]).optional(), // cadência: registra o toque dado
})

const TOUCH_ACTION: Record<"d0" | "d3" | "d7", string> = {
  d0: "prospect.contacted",
  d3: "prospect.followup3",
  d7: "prospect.followup7",
}
const ALL_ACTIONS = Object.values(TOUCH_ACTION)

/** Registra toques da cadência de prospecção (D0/D+3/D+7) via AuditLog. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { businessId } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success || (v.data.contacted === undefined && !v.data.touch)) {
    return NextResponse.json({ error: "Inválido" }, { status: 400 })
  }

  // Reset do ciclo (desmarcar): apaga todos os toques
  if (v.data.contacted === false) {
    await db.auditLog.deleteMany({ where: { action: { in: ALL_ACTIONS }, entityId: businessId } })
    return NextResponse.json({ ok: true })
  }

  const touch = v.data.touch ?? "d0" // contacted: true = D0 (compat)
  const action = TOUCH_ACTION[touch]
  const existing = await db.auditLog.findFirst({ where: { action, entityId: businessId } })
  if (!existing) {
    await db.auditLog.create({
      data: { actorId: session.user.id, action, entity: "Business", entityId: businessId, businessId },
    })
  }

  return NextResponse.json({ ok: true })
}
