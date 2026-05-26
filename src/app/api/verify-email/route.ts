// src/app/api/verify-email/route.ts - ✅ MANTER ESTE
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyEmailSchema } from "@/lib/validators/auth"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, code } = validation.data

    // Anti força-bruta do código de 6 dígitos: 10 tentativas / 15 min por email+IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const { allowed } = await checkRateLimit(`verify:${email}:${ip}`, 10, 15 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 15 minutos e tente de novo." },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const token = await prisma.authToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        type: "EMAIL_VERIFICATION",
        usedAt: null,
        expiresAt: { gte: new Date() }
      }
    })

    if (!token) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 400 }
      )
    }

    await prisma.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      }
    })

    console.log("✅ Email verificado:", user.email)

    return NextResponse.json({
      success: true,
      message: "Email verificado com sucesso!",
    })

  } catch (error) {
    console.error("❌ Erro na verificação:", error)
    return NextResponse.json(
      { error: "Erro ao verificar email" },
      { status: 500 }
    )
  }
}