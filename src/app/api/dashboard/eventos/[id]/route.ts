export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(3).max(160).optional(),
  excerpt: z.string().max(400).optional(),
  content: z.string().min(1).optional(),
  coverUrl: z.string().url().or(z.literal("")).optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().max(200).optional(),
  eventUrl: z.string().url().or(z.literal("")).optional(),
})

async function ownEvent(userId: string, id: string) {
  const ev = await db.event.findUnique({ where: { id } })
  if (!ev) return null
  const business = await db.business.findFirst({ where: { ownerId: userId } })
  if (!business || ev.businessId !== business.id) return null
  return ev
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params
  const ev = await ownEvent(session.user.id, id)
  if (!ev) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  // Editar volta para moderação (PENDING) — admin revisa de novo
  await db.event.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.excerpt !== undefined ? { excerpt: d.excerpt || null } : {}),
      ...(d.content !== undefined ? { content: d.content } : {}),
      ...(d.coverUrl !== undefined ? { coverUrl: d.coverUrl || null } : {}),
      ...(d.eventDate !== undefined ? { eventDate: d.eventDate ? new Date(d.eventDate) : null } : {}),
      ...(d.eventLocation !== undefined ? { eventLocation: d.eventLocation || null } : {}),
      ...(d.eventUrl !== undefined ? { eventUrl: d.eventUrl || null } : {}),
      status: "PENDING",
      moderationNote: null,
      publishedAt: null,
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params
  const ev = await ownEvent(session.user.id, id)
  if (!ev) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })
  await db.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
