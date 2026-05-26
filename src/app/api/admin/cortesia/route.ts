export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { sendPlanActivatedEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  businessId: z.string().min(1),
  plan: z.enum(["VISIBILITY", "PREMIUM"]),
  months: z.number().int().min(1).max(36),
  note: z.string().max(300).optional(),
})

/**
 * Concede CORTESIA (trial gratuito) de um plano pago a um negócio.
 * Ativa o plano igual a um pagamento, mas marca planIsCourtesy=true e registra
 * um PaymentClaim method="COURTESY" amountCents=0 — NÃO conta como receita.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const v = schema.safeParse(await req.json())
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const { businessId, plan, months, note } = v.data

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, ownerId: true, planExpiresAt: true } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })
  if (!business.ownerId) return NextResponse.json({ error: "O negócio precisa ter um dono (reivindicado) para receber cortesia." }, { status: 400 })

  // Estende se já estiver ativo
  const base = business.planExpiresAt && business.planExpiresAt > new Date() ? new Date(business.planExpiresAt) : new Date()
  const expiresAt = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000)

  await db.$transaction([
    db.business.update({
      where: { id: businessId },
      data: { plan, planExpiresAt: expiresAt, planIsCourtesy: true },
    }),
    db.subscription.upsert({
      where: { businessId },
      create: { businessId, plan, status: "ACTIVE", asaasCustomerId: "courtesy", expiresAt },
      update: { plan, status: "ACTIVE", expiresAt, canceledAt: null },
    }),
    db.paymentClaim.create({
      data: {
        businessId, userId: business.ownerId, plan, method: "COURTESY", months,
        amountCents: 0, status: "CONFIRMED", reviewedAt: new Date(), reviewerId: session.user.id,
        note: note?.trim() || "Cortesia concedida pelo admin",
      },
    }),
  ])

  await logAudit({
    actorId: session.user.id,
    action: "plan.courtesy_granted",
    entity: "Business",
    entityId: businessId,
    businessId,
    metadata: { plan, months, note: note?.trim() || null },
  })

  // Avisa o dono — vê como "plano ativado" (não revelamos que é cortesia)
  try {
    const owner = await db.user.findUnique({ where: { id: business.ownerId }, select: { email: true } })
    if (owner?.email) await sendPlanActivatedEmail(owner.email, business.name, plan, expiresAt)
  } catch (e) { console.error("Falha ao notificar cortesia:", e) }

  return NextResponse.json({ ok: true, expiresAt })
}
