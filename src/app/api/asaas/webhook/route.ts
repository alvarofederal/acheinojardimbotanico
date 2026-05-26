/**
 * POST /api/asaas/webhook
 * Recebe eventos de pagamento do Asaas e sincroniza Subscription + Business.plan.
 * Autenticação: header `asaas-access-token` deve bater com ASAAS_WEBHOOK_SECRET.
 */
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"

interface AsaasWebhookEvent {
  event: string
  payment?: {
    subscription?: string
    customer?: string
    value?: number
  }
}

export async function POST(req: NextRequest) {
  // Valida o token do webhook
  const token = req.headers.get("asaas-access-token")
  const secret = process.env.ASAAS_WEBHOOK_SECRET
  if (secret && token !== secret) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  let body: AsaasWebhookEvent
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const { event, payment } = body
  const subId = payment?.subscription
  if (!subId) return NextResponse.json({ ok: true }) // evento sem assinatura — ignora

  const subscription = await db.subscription.findFirst({ where: { asaasSubId: subId } })
  if (!subscription) return NextResponse.json({ ok: true }) // assinatura desconhecida

  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      // Ativa o plano por +30 dias
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await db.$transaction([
        db.subscription.update({
          where: { id: subscription.id },
          data: { status: "ACTIVE", expiresAt },
        }),
        db.business.update({
          where: { id: subscription.businessId },
          data: { plan: subscription.plan, planExpiresAt: expiresAt },
        }),
      ])
      break
    }

    case "PAYMENT_OVERDUE": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "PAST_DUE" },
      })
      break
    }

    case "PAYMENT_DELETED":
    case "SUBSCRIPTION_DELETED": {
      await db.$transaction([
        db.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELED", canceledAt: new Date() },
        }),
        db.business.update({
          where: { id: subscription.businessId },
          data: { plan: "FREE", planExpiresAt: null, planIsCourtesy: false },
        }),
      ])
      break
    }
  }

  await db.auditLog.create({
    data: {
      action: `asaas.${event.toLowerCase()}`,
      entity: "Subscription",
      entityId: subscription.id,
      metadata: { businessId: subscription.businessId, event },
    },
  })

  return NextResponse.json({ ok: true })
}
