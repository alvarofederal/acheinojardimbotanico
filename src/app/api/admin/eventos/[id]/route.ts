export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendEventModeratedEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature"]),
  note: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

  const ev = await db.event.findUnique({ where: { id } })
  if (!ev) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })

  const { action, note } = v.data

  if (action === "feature" || action === "unfeature") {
    if (action === "feature") await db.event.updateMany({ where: { featured: true, NOT: { id } }, data: { featured: false } })
    await db.event.update({ where: { id }, data: { featured: action === "feature" } })
    return NextResponse.json({ ok: true })
  }

  const published = action === "approve"
  await db.event.update({
    where: { id },
    data: {
      status: published ? "PUBLISHED" : "REJECTED",
      publishedAt: published ? (ev.publishedAt ?? new Date()) : null,
      moderationNote: action === "reject" ? (note || "Ajustes necessários.") : null,
    },
  })

  await db.auditLog.create({
    data: { actorId: session.user.id, action: `event.${action}`, entity: "Event", entityId: id, metadata: { note } },
  })

  // Notifica o dono
  try {
    if (ev.businessId) {
      const biz = await db.business.findUnique({ where: { id: ev.businessId }, select: { ownerId: true, name: true } })
      if (biz?.ownerId) {
        const owner = await db.user.findUnique({ where: { id: biz.ownerId }, select: { email: true } })
        if (owner?.email) await sendEventModeratedEmail(owner.email, ev.title, published, note)
      }
    }
  } catch (e) { console.error("Falha ao notificar moderação:", e) }

  return NextResponse.json({ ok: true })
}
