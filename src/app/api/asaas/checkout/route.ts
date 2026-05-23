/**
 * POST /api/asaas/checkout
 * Cria cliente + assinatura no Asaas e retorna o link de pagamento.
 * Requer anunciante autenticado com negócio vinculado.
 */
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import {
  createCustomer,
  createSubscription,
  getSubscriptionPaymentLink,
  PLAN_VALUES,
} from "@/lib/asaas"
import { z } from "zod"

const schema = z.object({
  plan: z.enum(["VISIBILITY", "PREMIUM"]),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  mobilePhone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  if (!process.env.ASAAS_API_KEY) {
    return NextResponse.json(
      { error: "Pagamentos ainda não estão configurados. Tente mais tarde." },
      { status: 503 }
    )
  }

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const { plan, cpfCnpj, mobilePhone } = v.data
  const value = PLAN_VALUES[plan]

  try {
    // 1. Cliente no Asaas
    const customer = await createCustomer({
      name: session.user.name ?? business.name,
      email: session.user.email ?? "",
      cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      mobilePhone,
    })

    // 2. Assinatura recorrente
    const subscription = await createSubscription({
      customerId: customer.id,
      value,
      description: `Plano ${plan} — ${business.name} (Achei no JBT)`,
    })

    // 3. Persiste localmente (status PAST_DUE até o webhook confirmar pagamento)
    await db.subscription.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        plan,
        status: "PAST_DUE",
        asaasCustomerId: customer.id,
        asaasSubId: subscription.id,
      },
      update: {
        plan,
        status: "PAST_DUE",
        asaasCustomerId: customer.id,
        asaasSubId: subscription.id,
        canceledAt: null,
      },
    })

    // 4. Link de pagamento
    const paymentLink = await getSubscriptionPaymentLink(subscription.id)

    return NextResponse.json({ paymentLink, subscriptionId: subscription.id })
  } catch (err) {
    console.error("Erro no checkout Asaas:", err)
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 })
  }
}
