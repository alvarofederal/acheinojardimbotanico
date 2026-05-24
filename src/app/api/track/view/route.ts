export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await req.json()
    if (!businessId) return NextResponse.json({}, { status: 400 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // update-primeiro evita a corrida do upsert (constraint única businessId+date)
    const updated = await db.businessView.updateMany({
      where: { businessId, date: today },
      data: { count: { increment: 1 } },
    })

    if (updated.count === 0) {
      try {
        await db.businessView.create({ data: { businessId, date: today, count: 1 } })
      } catch {
        // criado por outra requisição em paralelo → apenas incrementa
        await db.businessView.updateMany({
          where: { businessId, date: today },
          data: { count: { increment: 1 } },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
