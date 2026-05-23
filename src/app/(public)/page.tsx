import Link from "next/link"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { Search, MapPin, ArrowRight } from "lucide-react"

export const revalidate = 3600

const DEFAULT_BAIRRO = "jardim-botanico"

export default async function HomePage() {
  // Categorias com contagem de negócios
  const categories = await db.category.findMany({
    where: { businesses: { some: { status: { in: ["IMPORTED", "CLAIMED"] } } } },
    select: {
      slug: true,
      name: true,
      _count: { select: { businesses: true } },
    },
    orderBy: { businesses: { _count: "desc" } },
    take: 24,
  })

  const totalBusinesses = await db.business.count({
    where: { status: { in: ["IMPORTED", "CLAIMED"] } },
  })

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 dark:border-white/[0.06]">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            width: "700px", height: "500px", top: "-200px", left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(16,185,129,0.10), transparent 65%)",
            borderRadius: "50%",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-5">
            <MapPin className="w-3 h-3" />
            Jardim Botânico · Brasília (DF)
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Encontre tudo perto<br />de você no <span style={{ color: "#10b981" }}>Jardim Botânico</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-500 dark:text-white/50 max-w-xl mx-auto">
            Restaurantes, serviços, saúde, beleza e muito mais. O guia comercial completo da nossa região.
          </p>
          {totalBusinesses > 0 && (
            <p className="mt-3 text-sm text-gray-400 dark:text-white/30">
              {totalBusinesses.toLocaleString("pt-BR")} estabelecimentos cadastrados
            </p>
          )}
        </div>
      </section>

      {/* Categorias */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Explore por categoria</h2>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-white/30">
            <p className="font-medium mb-1">Ainda estamos populando o guia</p>
            <p className="text-sm">Em breve você encontrará os melhores negócios da região aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/${DEFAULT_BAIRRO}/${cat.slug}`}
                className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                    {cat._count.businesses} {cat._count.businesses === 1 ? "local" : "locais"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA anunciante */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 sm:p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Tem um negócio no Jardim Botânico?</h2>
          <p className="mt-2 text-emerald-50 max-w-md mx-auto">
            Coloque seu estabelecimento no guia e seja encontrado por quem está perto.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
          >
            Cadastrar meu negócio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
