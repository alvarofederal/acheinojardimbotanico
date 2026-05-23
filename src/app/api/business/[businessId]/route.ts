export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, slug: true, status: true },
  })
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(business)
}
