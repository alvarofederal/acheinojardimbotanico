export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(4000).optional(),
  type: z.string().max(30).nullable().optional(),
  email: z.string().email().max(120).nullable().optional(),
  showWhatsapp: z.boolean().optional(),
  active: z.boolean().optional(),
})

async function ownerVaga(userId: string, id: string) {
  const vaga = await db.vaga.findUnique({ where: { id } })
  if (!vaga) return null
  const business = await db.business.findFirst({ where: { ownerId: userId } })
  if (!business || vaga.businessId !== business.id) return null
  return vaga
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params

  const vaga = await ownerVaga(session.user.id, id)
  if (!vaga) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  await db.vaga.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.type !== undefined ? { type: d.type || null } : {}),
      ...(d.email !== undefined ? { email: d.email || null } : {}),
      ...(d.showWhatsapp !== undefined ? { showWhatsapp: d.showWhatsapp } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const { id } = await params

  const vaga = await ownerVaga(session.user.id, id)
  if (!vaga) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 })

  await db.vaga.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
