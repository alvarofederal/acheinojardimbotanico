/**
 * src/lib/asaas.ts
 * Cliente para a API do Asaas (pagamentos BR — PIX, cartão, boleto).
 * Docs: https://docs.asaas.com/reference
 *
 * Sandbox:    https://sandbox.asaas.com/api/v3
 * Produção:   https://api.asaas.com/v3
 */

const IS_SANDBOX = process.env.ASAAS_ENV !== "production"
const BASE_URL = IS_SANDBOX
  ? "https://sandbox.asaas.com/api/v3"
  : "https://api.asaas.com/v3"

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error("ASAAS_API_KEY não configurada")
  return key
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey(),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas API error (${res.status}): ${body}`)
  }

  return res.json() as Promise<T>
}

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  value: number
  cycle: string
  status: string
  nextDueDate: string
}

export type BillingType = "PIX" | "CREDIT_CARD" | "BOLETO" | "UNDEFINED"

// Valores dos planos (R$)
export const PLAN_VALUES: Record<string, number> = {
  VISIBILITY: 79,
  PREMIUM: 197,
}

// ─── Funções ─────────────────────────────────────────────────────────────────

/** Cria (ou retorna) um cliente no Asaas. */
export async function createCustomer(params: {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

/** Cria uma assinatura recorrente mensal. */
export async function createSubscription(params: {
  customerId: string
  value: number
  description: string
  billingType?: BillingType
  nextDueDate?: string
}): Promise<AsaasSubscription> {
  const nextDueDate =
    params.nextDueDate ??
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // amanhã

  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType ?? "UNDEFINED",
      value: params.value,
      nextDueDate,
      cycle: "MONTHLY",
      description: params.description,
    }),
  })
}

/** Recupera o link de pagamento da primeira cobrança da assinatura. */
export async function getSubscriptionPaymentLink(subscriptionId: string): Promise<string | null> {
  const data = await asaasFetch<{ data: Array<{ invoiceUrl: string }> }>(
    `/subscriptions/${subscriptionId}/payments`
  )
  return data.data?.[0]?.invoiceUrl ?? null
}

/** Cancela uma assinatura. */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" })
}
