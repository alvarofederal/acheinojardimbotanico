export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  pixKey: z.string().max(200).optional(),
  pixHolderName: z.string().max(120).optional(),
  pixCopyPaste: z.string().max(2000).optional(),
  mercadoPagoLink: z.string().url().or(z.literal("")).optional(),
  instructions: z.string().max(2000).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const data = {
    pixKey: v.data.pixKey || null,
    pixHolderName: v.data.pixHolderName || null,
    pixCopyPaste: v.data.pixCopyPaste || null,
    mercadoPagoLink: v.data.mercadoPagoLink || null,
    instructions: v.data.instructions || null,
  }

  await db.paymentConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  })

  return NextResponse.json({ ok: true })
}
