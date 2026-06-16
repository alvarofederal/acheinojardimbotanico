export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { invalidateSiteVisibilityCache } from "@/lib/site-visibility"
import { z } from "zod"

const schema = z.object({
  showPromocoes: z.boolean(),
  showNoticias: z.boolean(),
  showEventos: z.boolean(),
  showVagas: z.boolean(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  await db.siteConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...v.data },
    update: v.data,
  })

  invalidateSiteVisibilityCache()
  // Atualiza o navbar/rodapé/páginas (o layout público usa getMenuVisibility)
  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true })
}
