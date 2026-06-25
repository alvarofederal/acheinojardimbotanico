export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { z } from "zod"

const DEFAULT_BAIRRO = "jardim-botanico"

// slug NÃO é editável (está na URL da listagem → quebraria link/SEO)
const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  iconName: z.string().max(40).nullable().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  description: z.string().max(300).nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const category = await db.category.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })

  await db.category.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.iconName !== undefined ? { iconName: d.iconName || null } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
      ...(d.description !== undefined ? { description: d.description?.trim() || null } : {}),
    },
  })

  await logAudit({ actorId: session.user.id, action: "category.updated", entity: "Category", entityId: id, metadata: { ...d } })
  revalidatePath("/")
  revalidatePath(`/${DEFAULT_BAIRRO}/${category.slug}`)

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const category = await db.category.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, _count: { select: { businesses: true, children: true } } },
  })
  if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })

  // Trava: não apaga categoria com negócios (viraria órfão) nem com subcategorias
  if (category._count.businesses > 0)
    return NextResponse.json({ error: `Esta categoria tem ${category._count.businesses} negócio(s). Mova-os para outra categoria antes de apagar.` }, { status: 409 })
  if (category._count.children > 0)
    return NextResponse.json({ error: "Esta categoria tem subcategorias. Remova-as antes." }, { status: 409 })

  await db.category.delete({ where: { id } })
  await logAudit({ actorId: session.user.id, action: "category.deleted", entity: "Category", entityId: id, metadata: { name: category.name, slug: category.slug } })
  revalidatePath("/")

  return NextResponse.json({ ok: true })
}
