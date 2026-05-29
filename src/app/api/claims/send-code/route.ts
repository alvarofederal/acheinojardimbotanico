export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendClaimVerificationEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const { allowed } = await checkRateLimit(`claim-code:${session.user.id}:${ip}`, 5, 60 * 60 * 1000)
  if (!allowed) return NextResponse.json({ error: "Muitas tentativas. Tente em 1 hora." }, { status: 429 })

  // Invalida códigos anteriores
  await db.authToken.deleteMany({
    where: { userId: session.user.id, type: "CLAIM_VERIFICATION" },
  })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

  await db.authToken.create({
    data: { userId: session.user.id, token: code, type: "CLAIM_VERIFICATION", expiresAt },
  })

  try {
    await sendClaimVerificationEmail(session.user.email, code, session.user.name ?? undefined)
  } catch (e) {
    console.error("Erro ao enviar código de claim:", e)
    return NextResponse.json({ error: "Erro ao enviar email. Tente novamente." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
