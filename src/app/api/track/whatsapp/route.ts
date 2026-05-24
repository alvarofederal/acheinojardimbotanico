export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await req.json()
    if (!businessId) return NextResponse.json({}, { status: 400 })

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    await db.$executeRawUnsafe(
      "INSERT INTO `WhatsappClick` (`id`, `businessId`, `date`, `count`) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE `count` = `count` + 1",
      randomUUID(),
      businessId,
      today
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
