export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(3).max(160),
  excerpt: z.string().max(400).optional(),
  content: z.string().min(1),
  coverUrl: z.string().url().or(z.literal("")).optional(),
  featured: z.boolean().default(false),
  publish: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  // Só uma notícia em destaque por vez
  if (d.featured) await db.news.updateMany({ where: { featured: true }, data: { featured: false } })

  const news = await db.news.create({
    data: {
      title: d.title,
      slug: `${slugify(d.title).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`,
      excerpt: d.excerpt || null,
      content: d.content,
      coverUrl: d.coverUrl || null,
      featured: d.featured,
      status: d.publish ? "PUBLISHED" : "DRAFT",
      publishedAt: d.publish ? new Date() : null,
      authorId: session.user.id,
    },
  })
  return NextResponse.json({ news })
}
