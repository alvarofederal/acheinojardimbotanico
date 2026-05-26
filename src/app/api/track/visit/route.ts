export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { randomUUID } from "crypto"

/**
 * Registra presença anônima do visitante (cookie ajb_vid). Alimenta as métricas
 * de "online agora" e "visitantes ativos" no painel admin. Sem PII.
 */
export async function POST(req: NextRequest) {
  try {
    let visitorId = req.cookies.get("ajb_vid")?.value
    const res = NextResponse.json({ ok: true })

    if (!visitorId) {
      visitorId = randomUUID()
      res.cookies.set("ajb_vid", visitorId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      })
    }

    await db.presence.upsert({
      where: { visitorId },
      create: { visitorId },
      update: { hits: { increment: 1 } }, // lastSeen atualiza via @updatedAt
    })

    return res
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}
