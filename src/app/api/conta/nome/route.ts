export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100).trim(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  await db.user.update({ where: { id: session.user.id }, data: { name: v.data.name } })

  return NextResponse.json({ ok: true })
}
