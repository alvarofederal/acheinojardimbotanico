export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendPaymentClaimEmail } from "@/lib/email"
import { type PlanId } from "@/lib/plans"
import { planPriceCents } from "@/lib/plan-config"
import { z } from "zod"

const schema = z.object({
  plan: z.enum(["VISIBILITY", "PREMIUM"]),
  method: z.enum(["PIX", "MERCADO_PAGO"]),
  months: z.number().int().min(1).max(12),
  note: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const { plan, method, months, note } = v.data
  const amountCents = await planPriceCents(plan as PlanId, months)

  await db.paymentClaim.create({
    data: {
      businessId: business.id,
      userId: session.user.id,
      plan,
      method,
      months,
      amountCents,
      note: note ?? null,
      status: "PENDING",
    },
  })

  // Notifica admins
  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })
    await Promise.all(
      admins.filter(a => a.email).map(a =>
        sendPaymentClaimEmail(a.email!, business.name, plan, months, amountCents, method)
      )
    )
  } catch (e) { console.error("Falha ao notificar admins do pagamento:", e) }

  return NextResponse.json({ ok: true })
}
