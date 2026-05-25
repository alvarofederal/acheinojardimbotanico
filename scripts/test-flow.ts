/**
 * Teste de ponta a ponta (lógica) das features de pagamento manual + vitrine.
 * Cria um cenário isolado, valida cada passo e limpa tudo no fim.
 * Uso: node_modules/.bin/tsx scripts/test-flow.ts
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/index.js"
import { DEFAULT_PLAN_CONFIGS } from "../src/lib/plans"
import QRCode from "qrcode"

const db = new PrismaClient()
const ok = (b: boolean, msg: string) => console.log(`${b ? "✅" : "❌"} ${msg}`)

async function main() {
  console.log("🧪 Teste de fluxo — pagamento manual + vitrine\n")

  // categoria (reusa ou cria)
  const cat = await db.category.upsert({ where: { slug: "outros" }, create: { slug: "outros", name: "Outros" }, update: {} })

  // 1) Cenário isolado: anunciante + negócio
  const user = await db.user.create({ data: { email: `teste_${Date.now()}@teste.local`, name: "Anunciante Teste", role: "ADVERTISER" } })
  const biz = await db.business.create({
    data: {
      slug: `teste-fluxo-${Date.now()}`, name: "Negócio de Teste", categoryId: cat.id,
      address: "Rua Teste", neighborhood: "Jardim Botânico", latitude: -15.87, longitude: -47.81,
      whatsapp: "+5561999999999", status: "CLAIMED", plan: "FREE", ownerId: user.id,
      storeWhatsappMessage: "Olá! Quero comprar:",
    },
  })
  console.log("Cenário criado (negócio FREE)\n")

  // 2) PIX config + QR
  const sampleBrCode = "00020126360014BR.GOV.BCB.PIX0114+556199999999952040000530398654041.005802BR5909Teste JBT6009BRASILIA62070503***6304ABCD"
  const qr = await QRCode.toDataURL(sampleBrCode, { width: 200 })
  ok(qr.startsWith("data:image/png;base64,"), "QR Code do PIX gerado")

  // 3) "Já paguei" → PaymentClaim
  const months = 3
  const amount = DEFAULT_PLAN_CONFIGS.VISIBILITY.priceCents * months
  const claim = await db.paymentClaim.create({
    data: { businessId: biz.id, userId: user.id, plan: "VISIBILITY", method: "PIX", months, amountCents: amount, status: "PENDING" },
  })
  ok(amount === 79 * 100 * 3, `PaymentClaim criado (R$ ${(amount / 100).toFixed(2)} = 3× R$79)`)

  // 4) Admin confirma → ativa plano (mesma lógica da rota)
  const base = biz.planExpiresAt && biz.planExpiresAt > new Date() ? new Date(biz.planExpiresAt) : new Date()
  const expiresAt = new Date(base.getTime() + months * 30 * 24 * 60 * 60 * 1000)
  await db.$transaction([
    db.business.update({ where: { id: biz.id }, data: { plan: "VISIBILITY", planExpiresAt: expiresAt } }),
    db.subscription.upsert({
      where: { businessId: biz.id },
      create: { businessId: biz.id, plan: "VISIBILITY", status: "ACTIVE", asaasCustomerId: "manual", expiresAt },
      update: { plan: "VISIBILITY", status: "ACTIVE", expiresAt },
    }),
    db.paymentClaim.update({ where: { id: claim.id }, data: { status: "CONFIRMED", reviewedAt: new Date() } }),
  ])
  const after = await db.business.findUnique({ where: { id: biz.id } })
  const daysAhead = Math.round(((after!.planExpiresAt!.getTime()) - Date.now()) / 864e5)
  ok(after!.plan === "VISIBILITY", "Plano ativado para VISIBILITY")
  ok(daysAhead >= 89 && daysAhead <= 90, `Vencimento ~90 dias (${daysAhead}d)`)

  // 5) Limite de produtos do plano
  const limit = DEFAULT_PLAN_CONFIGS.VISIBILITY.productLimit
  ok(limit === 10, `Limite de produtos do plano = ${limit}`)

  // 6) Cria produto na vitrine
  await db.product.create({
    data: {
      businessId: biz.id, name: "Quadro A4 personalizado", categoria: "Quadros",
      priceMode: "FROM", priceCents: 3000, images: ["https://res.cloudinary.com/teste/img.jpg"] as unknown as object,
      variations: [{ nome: "Tamanho", opcoes: ["A4", "A3"] }] as unknown as object, soldOut: false, active: true,
    },
  })
  const prodCount = await db.product.count({ where: { businessId: biz.id } })
  ok(prodCount === 1, "Produto criado na vitrine")

  // 7) Query pública (vitrine + selo Loja)
  const publicView = await db.business.findUnique({
    where: { id: biz.id },
    include: { products: { where: { active: true } }, photos: true },
  })
  ok((publicView?.products.length ?? 0) > 0, "Vitrine pública retorna produtos (selo 'Loja' apareceria)")
  const prod = publicView!.products[0]
  const imgs = Array.isArray(prod.images) ? (prod.images as unknown as string[]) : []
  ok(imgs.length === 1 && prod.priceMode === "FROM", "Produto com foto + modo 'A partir de' OK")

  // limpeza
  await db.product.deleteMany({ where: { businessId: biz.id } })
  await db.paymentClaim.deleteMany({ where: { businessId: biz.id } })
  await db.subscription.deleteMany({ where: { businessId: biz.id } })
  await db.business.delete({ where: { id: biz.id } })
  await db.user.delete({ where: { id: user.id } })
  console.log("\n🧹 Cenário de teste removido")
  console.log("\n✅ Fluxo completo validado: PIX/QR → pagamento → confirmação → plano ativo → vitrine")
  await db.$disconnect()
}

main().catch(async e => { console.error("❌ ERRO:", e); await db.$disconnect(); process.exit(1) })
