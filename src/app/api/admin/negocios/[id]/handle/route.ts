export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { validateHandle, normalizeHandle } from "@/lib/handle"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({ handle: z.string().max(40) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  const raw = v.data.handle.trim()

  // Vazio = limpar o slug
  if (raw === "") {
    await db.business.update({ where: { id }, data: { handle: null } })
    return NextResponse.json({ ok: true, handle: null })
  }

  const err = validateHandle(raw)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const norm = normalizeHandle(raw)
  const taken = await db.business.findUnique({ where: { handle: norm }, select: { id: true } })
  if (taken && taken.id !== id) return NextResponse.json({ error: "Esse link já está em uso." }, { status: 409 })

  await db.business.update({ where: { id }, data: { handle: norm } })
  await logAudit({
    actorId: session.user.id,
    action: "business.handle_set",
    entity: "Business", entityId: id, businessId: id, metadata: { handle: norm },
  })

  return NextResponse.json({ ok: true, handle: norm })
}
