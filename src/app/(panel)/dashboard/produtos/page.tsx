import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { PRODUCT_LIMITS, type PlanId } from "@/lib/plans"
import { ProductManager, type Product } from "./_components/product-manager"
import { StoreMessage } from "./_components/store-message"
import { Store } from "lucide-react"

export default async function ProdutosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    include: { products: { orderBy: { order: "asc" } } },
  })

  if (!business) return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Vitrine de Produtos</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para montar sua vitrine.</p>
        <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  const products: Product[] = business.products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    categoria: p.categoria,
    priceMode: p.priceMode as Product["priceMode"],
    priceCents: p.priceCents,
    promoPriceCents: p.promoPriceCents,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    variations: Array.isArray(p.variations) ? (p.variations as unknown as Product["variations"]) : [],
    soldOut: p.soldOut,
  }))

  const limit = PRODUCT_LIMITS[business.plan as PlanId] ?? 2

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Vitrine de Produtos</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Monte sua vitrine e venda pelo WhatsApp — {business.name}</p>
      </div>

      <StoreMessage initial={business.storeWhatsappMessage ?? ""} />
      <ProductManager products={products} limit={limit} plan={business.plan} />
    </div>
  )
}
