export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { randomUUID } from "crypto"

const ALLOWED = new Set(["ifood", "oferta"])

/** Conta cliques em canais externos do perfil (iFood, CTA da Oferta). Contagem diária por tipo. */
export async function POST(req: NextRequest) {
  try {
    const { businessId, kind } = await req.json()
    if (!businessId || !ALLOWED.has(kind)) return NextResponse.json({}, { status: 400 })

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    await db.$executeRawUnsafe(
      "INSERT INTO `LinkClick` (`id`, `businessId`, `kind`, `date`, `count`) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE `count` = `count` + 1",
      randomUUID(),
      businessId,
      kind,
      today
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
