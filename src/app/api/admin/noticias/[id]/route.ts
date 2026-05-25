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
  featured: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const existing = await db.news.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Notícia não encontrada" }, { status: 404 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  if (d.featured) await db.news.updateMany({ where: { featured: true, NOT: { id } }, data: { featured: false } })

  await db.news.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.excerpt !== undefined ? { excerpt: d.excerpt || null } : {}),
      ...(d.content !== undefined ? { content: d.content } : {}),
      ...(d.coverUrl !== undefined ? { coverUrl: d.coverUrl || null } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
      ...(d.publish !== undefined ? { status: d.publish ? "PUBLISHED" : "DRAFT", publishedAt: d.publish ? (existing.publishedAt ?? new Date()) : null } : {}),
    },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  const { id } = await params
  await db.news.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
