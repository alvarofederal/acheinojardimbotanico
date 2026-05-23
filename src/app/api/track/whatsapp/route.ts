export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await req.json()
    if (!businessId) return NextResponse.json({}, { status: 400 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await db.whatsappClick.upsert({
      where: { businessId_date: { businessId, date: today } },
      create: { businessId, date: today, count: 1 },
      update: { count: { increment: 1 } },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
