export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validators/auth"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const v = resetPasswordSchema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const { token, password } = v.data

  const authToken = await db.authToken.findUnique({ where: { token } })
  if (
    !authToken ||
    authToken.type !== "PASSWORD_RESET" ||
    authToken.usedAt ||
    authToken.expiresAt < new Date()
  ) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.$transaction([
    db.user.update({
      where: { id: authToken.userId },
      data: { passwordHash },
    }),
    db.authToken.update({
      where: { id: authToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalida sessões ativas por segurança
    db.session.deleteMany({ where: { userId: authToken.userId } }),
  ])

  return NextResponse.json({ ok: true, message: "Senha redefinida com sucesso!" })
}
