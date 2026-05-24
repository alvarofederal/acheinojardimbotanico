# Spec — Vitrine de Produtos (mini-loja do anunciante)

> Status: **proposta — aguardando aprovação**
> Objetivo: dar ao anunciante PAGANTE uma vitrine de produtos com pedido via
> WhatsApp, agregando valor que justifica a assinatura. **Não** é e-commerce
> transacional (sem carrinho/pagamento/frete na v1).

## Por que (valor)

- Negócios menores (ateliês, artesanato, doces) **não têm site** → ganham loja online.
- Reproduz o fluxo que o pequeno comércio BR já usa: vitrine + WhatsApp.
- Justifica o plano pago: "monte sua vitrine e venda pelo WhatsApp, tudo num lugar".

## Quem pode usar

- Apenas planos **VISIBILITY** e **PREMIUM** (gancho de upgrade).
- Limite de produtos por plano: Visibilidade = 10, Premium = 50.

## Modelo de dados (novo)

```prisma
model Product {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  description String?  @db.Text
  priceCents  Int                 // preço em centavos (evita float)
  imageUrl    String?  @db.Text    // upload via Cloudinary (já temos)
  active      Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  @@index([businessId])
}
```
(+ relação `products Product[]` em `Business`)

## Telas

### Anunciante (painel)
- **/dashboard/produtos** — lista dos seus produtos (grade), botão "Adicionar produto".
- Modal/form: nome, descrição, preço, foto (upload Cloudinary), ativo (sim/não).
- Respeita limite do plano; bloqueia se FREE (com upsell).

### Público (perfil do negócio)
- Nova aba/seção **"Produtos"** na página do negócio (`/[bairro]/[categoria]/[slug]`).
- Grade de cards: foto, nome, preço, botão **"Comprar pelo WhatsApp"**.
- O botão abre `https://wa.me/<whatsapp>?text=Olá! Tenho interesse no produto "<nome>" (R$ <preço>) que vi no Achei no Jardim Botânico.`
- Rastreia o clique (reusa o tracking de WhatsApp → entra no ROI do anunciante).

## APIs
- `POST /api/dashboard/produtos` — cria (valida plano + limite)
- `PATCH/DELETE /api/dashboard/produtos/[id]` — edita/remove (só dono)
- Upload de imagem: reusa `/api/upload` (Cloudinary) já existente.

## Fora de escopo (v1) — fica para v2 se houver demanda
- Carrinho, pagamento online, split, estoque, frete, pedidos/status.
- Esses entram só se os lojistas pedirem e pagarem por isso (Premium+).

## Esforço estimado
- Schema + APIs: ~pequeno
- Painel de produtos (CRUD + upload): ~médio
- Seção pública + botão WhatsApp: ~pequeno
- Total: viável em poucas sessões, incremental.

## Métrica de sucesso
- % de anunciantes pagantes que cadastram ≥ 1 produto.
- Cliques em "Comprar pelo WhatsApp" (já medido no ROI).
