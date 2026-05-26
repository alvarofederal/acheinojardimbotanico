export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({ contacted: z.boolean() })

/** Marca/desmarca um negócio como "contatado" na prospecção (via AuditLog). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { businessId } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: "Inválido" }, { status: 400 })

  if (v.data.contacted) {
    const existing = await db.auditLog.findFirst({ where: { action: "prospect.contacted", entityId: businessId } })
    if (!existing) {
      await db.auditLog.create({
        data: { actorId: session.user.id, action: "prospect.contacted", entity: "Business", entityId: businessId, businessId },
      })
    }
  } else {
    await db.auditLog.deleteMany({ where: { action: "prospect.contacted", entityId: businessId } })
  }

  return NextResponse.json({ ok: true })
}
