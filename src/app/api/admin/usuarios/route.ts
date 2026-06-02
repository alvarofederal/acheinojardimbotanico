export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100).trim(),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  role: z.enum(["VISITOR", "ADVERTISER", "ADMIN"]),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(128),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const { name, email, role, password } = v.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })

  const user = await db.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 12),
      emailVerified: new Date(), // criado pelo admin já entra verificado
    },
  })

  await logAudit({
    actorId: session.user.id,
    action: "user.created",
    entity: "User",
    entityId: user.id,
    metadata: { email, role },
  })

  return NextResponse.json({ ok: true, id: user.id })
}
