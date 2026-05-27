export const runtime = "nodejs"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

/** Contadores de pendências do admin (alimenta o sininho e os badges do menu). */
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ total: 0 })

  const [claims, payments, events, pendingBusinesses] = await Promise.all([
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.paymentClaim.count({ where: { status: "PENDING" } }),
    db.event.count({ where: { status: "PENDING" } }),
    db.business.count({ where: { status: "PENDING_REVIEW" } }),
  ])

  return NextResponse.json({
    claims, payments, events, pendingBusinesses,
    total: claims + payments + events + pendingBusinesses,
  })
}
