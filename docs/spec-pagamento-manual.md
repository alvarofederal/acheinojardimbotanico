# Spec — Pagamento Manual (PIX + Mercado Pago, liberação manual)

> Status: **proposta — aguardando aprovação p/ construir**
> Objetivo: cobrar o anunciante SEM automação no 1º momento. O Álvaro exibe a
> chave PIX (QR) e/ou um link do Mercado Pago (cartão); o anunciante paga; o
> Álvaro confere no banco/MP e **libera o plano manualmente** pelo período pago.

## Por que assim (e não Asaas automático agora)
- Zero custo/integração de gateway no início.
- Controle total: o Álvaro confere cada pagamento antes de liberar.
- Simples de operar com poucos clientes (fase inicial).
- Quando o volume crescer, plugamos o Asaas automático (código já existe, fica dormente).

## Modelo de dados

```prisma
// Configuração de cobrança (linha única, editada pelo admin)
model PaymentConfig {
  id              String   @id @default("default")
  pixKey          String?              // chave PIX exibida (texto)
  pixHolderName   String?              // nome do recebedor
  pixCopyPaste    String?  @db.Text     // PIX "copia e cola" (BR Code) → vira QR
  mercadoPagoLink String?  @db.Text     // link de pagamento por cartão
  instructions    String?  @db.Text     // instruções livres
  updatedAt       DateTime @updatedAt
}

// Anunciante informa que pagou → admin confere e libera
model PaymentClaim {
  id          String    @id @default(cuid())
  businessId  String
  userId      String
  plan        Plan                       // VISIBILITY | PREMIUM
  method      String                     // PIX | MERCADO_PAGO
  months      Int       @default(1)      // período pago
  amountCents Int                        // valor informado
  status      String    @default("PENDING") // PENDING | CONFIRMED | REJECTED
  note        String?   @db.Text          // obs do anunciante (ex: comprovante)
  createdAt   DateTime  @default(now())
  reviewedAt  DateTime?
  reviewerId  String?

  @@index([status])
  @@index([businessId])
}
```

## Fluxo

### 1. Admin configura a cobrança — /dashboard/admin/pagamento
- Campos: chave PIX, nome do recebedor, **PIX copia-e-cola** (colado do app do banco),
  link do Mercado Pago, instruções.
- O "copia-e-cola" é o jeito robusto: o banco gera um BR Code válido; nós só
  transformamos em **QR Code** e mostramos o texto pra copiar.

### 2. Anunciante paga — /dashboard/plano
- Escolhe o plano (Visibilidade R$79 / Premium R$197) e o período (1, 3, 6, 12 meses).
- Vê duas opções:
  - **PIX:** QR Code (do copia-e-cola) + chave + nome do recebedor + botão "copiar".
  - **Cartão:** botão "Pagar com cartão" → abre o link do Mercado Pago.
- Após pagar, clica **"Já efetuei o pagamento"** → cria um `PaymentClaim` (PENDING)
  e dispara email pro admin.
- Tela mostra: "Recebemos! Seu plano será liberado em até 24h após a confirmação."

### 3. Admin confere e libera — /dashboard/admin/pagamentos
- Lista de `PaymentClaim` PENDENTES (negócio, plano, método, valor, meses, data).
- Botão **"Confirmar e liberar"** → numa transação:
  - `Business.plan = plano`, `planExpiresAt = hoje + (meses × 30 dias)`
  - cria/atualiza `Subscription` (ACTIVE, expiresAt)
  - `PaymentClaim.status = CONFIRMED`
  - registra no AuditLog
  - (opcional) email ao anunciante "plano liberado!"
- Botão **"Rejeitar"** (não localizei o pagamento) → status REJECTED + email opcional.

### 4. Expiração
- Job/checagem simples: quando `planExpiresAt < hoje`, volta para FREE.
  (v1 pode checar na leitura; cron fica para depois.)

## Telas novas
- `/dashboard/admin/pagamento` — configurar PIX/MP (admin)
- `/dashboard/admin/pagamentos` — confirmar pagamentos pendentes (admin)
- `/dashboard/plano` — reformulada: mostra PIX/QR/cartão + "já paguei" (anunciante)

## Dependência
- Geração de **QR Code** do copia-e-cola → lib `qrcode` (pequena, server-side).

## Fora de escopo (v1)
- Conferência automática (webhook PIX/MP), emissão de NF, cobrança recorrente automática.
  → Asaas automático entra quando o volume justificar.

## Observação de segurança/LGPD
- Não armazenamos comprovante com dado sensível; o `note` é texto livre opcional.
- A chave PIX exibida é do recebedor (Álvaro) — informação de cobrança, não de terceiros.
