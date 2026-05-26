export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendPlanActivatedEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({ action: z.enum(["confirm", "reject"]) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

  const claim = await db.paymentClaim.findUnique({ where: { id } })
  if (!claim) return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
  if (claim.status !== "PENDING") return NextResponse.json({ error: "Pagamento já processado" }, { status: 409 })

  if (v.data.action === "reject") {
    await db.paymentClaim.update({
      where: { id }, data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: session.user.id },
    })
    await db.auditLog.create({
      data: {
        actorId: session.user.id, action: "payment.rejected", entity: "PaymentClaim", entityId: id,
        businessId: claim.businessId,
        metadata: { plan: claim.plan, months: claim.months, amountCents: claim.amountCents },
      },
    })
    return NextResponse.json({ ok: true })
  }

  // CONFIRMAR — ativa o plano pelo período pago (estende se já ativo)
  const business = await db.business.findUnique({ where: { id: claim.businessId } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  const base = business.planExpiresAt && business.planExpiresAt > new Date()
    ? new Date(business.planExpiresAt)
    : new Date()
  const expiresAt = new Date(base.getTime() + claim.months * 30 * 24 * 60 * 60 * 1000)

  await db.$transaction([
    db.business.update({
      where: { id: business.id },
      data: { plan: claim.plan, planExpiresAt: expiresAt, planIsCourtesy: false },
    }),
    db.subscription.upsert({
      where: { businessId: business.id },
      create: { businessId: business.id, plan: claim.plan, status: "ACTIVE", asaasCustomerId: "manual", expiresAt },
      update: { plan: claim.plan, status: "ACTIVE", expiresAt, canceledAt: null },
    }),
    db.paymentClaim.update({
      where: { id }, data: { status: "CONFIRMED", reviewedAt: new Date(), reviewerId: session.user.id },
    }),
    db.auditLog.create({
      data: {
        actorId: session.user.id, action: "payment.confirmed", entity: "PaymentClaim", entityId: id,
        businessId: business.id,
        metadata: { plan: claim.plan, months: claim.months, amountCents: claim.amountCents },
      },
    }),
  ])

  // Notifica o anunciante
  try {
    const owner = business.ownerId ? await db.user.findUnique({ where: { id: business.ownerId }, select: { email: true } }) : null
    if (owner?.email) await sendPlanActivatedEmail(owner.email, business.name, claim.plan, expiresAt)
  } catch (e) { console.error("Falha ao notificar ativação:", e) }

  return NextResponse.json({ ok: true })
}
