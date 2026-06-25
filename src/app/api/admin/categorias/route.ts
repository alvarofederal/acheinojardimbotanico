export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const RESERVED_CAT_SLUGS = new Set(["loja", "busca"]) // segmentos especiais sob /{bairro}/...

const schema = z.object({
  name: z.string().min(2).max(60),
  iconName: z.string().max(40).optional(),
  order: z.number().int().min(0).max(9999).optional(),
  description: z.string().max(300).optional(),
})

/** Gera um slug único de categoria a partir do nome (sufixo -2, -3… se preciso). */
async function uniqueCategorySlug(name: string): Promise<string> {
  const base = slugify(name).slice(0, 50) || "categoria"
  for (let i = 0; i < 100; i++) {
    const cand = i === 0 ? base : `${base}-${i + 1}`
    if (RESERVED_CAT_SLUGS.has(cand)) continue
    const taken = await db.category.findUnique({ where: { slug: cand }, select: { id: true } })
    if (!taken) return cand
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const slug = await uniqueCategorySlug(d.name)
  const category = await db.category.create({
    data: {
      name: d.name.trim(),
      slug,
      iconName: d.iconName || null,
      order: d.order ?? 0,
      description: d.description?.trim() || null,
    },
  })

  await logAudit({ actorId: session.user.id, action: "category.created", entity: "Category", entityId: category.id, metadata: { name: category.name, slug } })
  revalidatePath("/")

  return NextResponse.json({ ok: true, category })
}
