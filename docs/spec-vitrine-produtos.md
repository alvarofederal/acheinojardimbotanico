# Spec — Vitrine de Produtos (mini-loja do anunciante)

> Status: **proposta v2 — com ajustes do Álvaro, aguardando aprovação p/ construir**
> Objetivo: dar ao anunciante uma vitrine de produtos com pedido via WhatsApp,
> agregando valor que justifica a assinatura. **Não** é e-commerce transacional
> (sem carrinho/pagamento/frete na v1).

## Por que (valor)
- Negócios menores (ateliês, artesanato, doces) não têm site → ganham loja online.
- Reproduz o fluxo que o pequeno comércio BR já usa: vitrine + WhatsApp.
- Justifica o plano pago: "monte sua vitrine e venda pelo WhatsApp, tudo num lugar".

## Limites por plano
- **FREE: 2 produtos** (isca, para experimentar)
- **VISIBILITY: 10 produtos**
- **PREMIUM: 50 produtos**

## Modelo de dados

```prisma
model Product {
  id          String           @id @default(cuid())
  businessId  String
  name        String
  description String?          @db.Text
  categoria   String?          // tipo/categoria do produto (texto livre)
  priceMode   ProductPriceMode @default(FIXED)
  priceCents  Int?             // preço em centavos; null se ON_REQUEST
  images      Json?            // até 4 URLs (Cloudinary)
  variations  Json?            // ex: [{ "nome": "Tamanho", "opcoes": ["P","M","G"] }]
  soldOut     Boolean          @default(false)  // "esgotado"
  active      Boolean          @default(true)
  order       Int              @default(0)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  @@index([businessId])
}

enum ProductPriceMode {
  FIXED        // "R$ 30,00"
  FROM         // "A partir de R$ 30,00"
  ON_REQUEST   // "Sob consulta"
}
```
+ em `Business`: `products Product[]` e `storeWhatsappMessage String? @db.Text`
  (mensagem padrão que o lojista escreve; o link do produto é anexado automaticamente).

## Telas

### Anunciante (painel) — /dashboard/produtos
- Grade dos produtos + "Adicionar produto" (respeita limite do plano; FREE até 2).
- Form: nome, categoria, descrição, **modo de preço** (fixo / a partir de / sob consulta) + valor,
  **até 4 fotos** (upload Cloudinary), variações (tamanho/cor), "esgotado", ativo.
- Campo de **mensagem do WhatsApp** (o lojista escreve a que quiser).
- Reordenação manual (campo `order`).

### Público (perfil do negócio)
- Seção **"Produtos"** na página `/[bairro]/[categoria]/[slug]`.
- Grade de cards: foto principal, nome, preço (conforme modo), selo "Esgotado" quando aplicável.
- **Filtro de ordenação**: mais recentes · menor preço · maior preço · manual.
- Clique no card → galeria do produto (até 4 fotos) + botão **"Comprar pelo WhatsApp"**.
- Mensagem do WhatsApp = `storeWhatsappMessage` do lojista + **link do produto** anexado
  (a foto não vai no texto do wa.me, mas o link abre a página com as fotos).
- Clique rastreado (entra no ROI/métricas do anunciante).

### Selo "tem loja" (visão de negócio)
- Negócios com ≥ 1 produto ativo ganham um **selo "Loja"** nos cards (home, listagem, busca).
- Ajuda a vender o plano: vira um diferencial visível.

## APIs
- `POST /api/dashboard/produtos` — cria (valida plano + limite)
- `PATCH /api/dashboard/produtos/[id]` · `DELETE` — edita/remove (só dono)
- Upload de imagem: reusa `/api/upload` (Cloudinary).

## Fora de escopo (v1) → v2 se houver demanda
- Carrinho, pagamento online, split, estoque, frete, pedidos/status.

## Métrica de sucesso
- % de pagantes que cadastram ≥ 1 produto.
- Cliques em "Comprar pelo WhatsApp" (medido no ROI).
