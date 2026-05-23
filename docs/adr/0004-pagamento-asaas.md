# ADR 0004 — Asaas como provedor de pagamento

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

O Roberto (comerciante local do DF) é a fonte de receita do MVP. Ele paga uma
mensalidade por destaque (Visibilidade R$79, Premium R$197). O meio de pagamento
precisa ser natural para o pequeno empreendedor brasileiro — **PIX é inegociável**.
O Courtesyfy já tinha código de Stripe, o que tornava Stripe a opção "de menor esforço".

## Decisão

**Usar o Asaas, não o Stripe.**

- PIX nativo, boleto e cartão — os três meios que o Roberto usa.
- Assinatura recorrente mensal via API (`/subscriptions`, `cycle: MONTHLY`).
- Webhook (`/api/asaas/webhook`) sincroniza `Subscription.status` e `Business.plan`:
  - `PAYMENT_CONFIRMED/RECEIVED` → `ACTIVE`, plano por +30 dias.
  - `PAYMENT_OVERDUE` → `PAST_DUE`.
  - `SUBSCRIPTION_DELETED` → `CANCELED`, volta para `FREE`.
- Sandbox/produção alternados por `ASAAS_ENV`.

## Alternativas consideradas

- **Stripe:** código já existia no Courtesyfy, mas PIX no Stripe Brasil é limitado e o
  público-alvo prefere PIX/boleto. Manter Stripe seria otimizar pelo esforço errado.
- **Mercado Pago:** boa cobertura BR, mas API de assinaturas menos direta que a do Asaas
  para o nosso caso.
- **Pagar.me:** viável, mas Asaas tem melhor DX para PME e cobrança recorrente simples.

## Consequências

- (+) Meio de pagamento alinhado ao Roberto (PIX/boleto) → menos atrito na conversão.
- (+) Webhook único mantém plano e assinatura em sincronia.
- (−) Descartamos o código Stripe do Courtesyfy (custo afundado aceito).
- (−) Nova integração a aprender/testar (mitigado: sandbox do Asaas).
