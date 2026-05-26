export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validators/auth"
import { sendPasswordResetEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"
import { SITE_URL } from "@/lib/utils"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const { allowed } = await checkRateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente em 1 hora." }, { status: 429 })
  }

  const body = await req.json()
  const v = forgotPasswordSchema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const { email } = v.data
  const user = await db.user.findUnique({ where: { email } })

  // Resposta genérica — não revela se o email existe (enumeração)
  if (user) {
    // Invalida tokens antigos de reset
    await db.authToken.deleteMany({ where: { userId: user.id, type: "PASSWORD_RESET" } })

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

    await db.authToken.create({
      data: { userId: user.id, token, type: "PASSWORD_RESET", expiresAt },
    })

    const resetUrl = `${SITE_URL}/reset-password?token=${token}`
    try {
      await sendPasswordResetEmail(email, resetUrl)
    } catch (e) {
      console.error("Erro ao enviar email de reset:", e)
    }
  }

  return NextResponse.json({ ok: true, message: "Se o email existir, enviaremos um link de recuperação." })
}
