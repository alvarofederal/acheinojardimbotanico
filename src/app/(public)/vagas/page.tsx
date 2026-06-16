import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { getMenuVisibility } from "@/lib/site-visibility"
import { getPlanConfigs } from "@/lib/plan-config"
import { PLAN_IDS } from "@/lib/plans"
import { Briefcase, MapPin } from "lucide-react"

export const revalidate = 300 // 5 min — vagas mudam, mas não precisa ser tempo real

export const metadata: Metadata = {
  title: "Vagas de emprego no Jardim Botânico",
  description: "Oportunidades de trabalho nos comércios e serviços do bairro Jardim Botânico (DF). Candidate-se pelo WhatsApp ou e-mail.",
}

export default async function VagasPublicPage({ searchParams }: { searchParams: Promise<{ negocio?: string }> }) {
  const { negocio } = await searchParams
  if (!(await getMenuVisibility()).vagas) notFound()

  // Só mostram vagas os negócios reivindicados em planos que liberam o recurso.
  const configs = await getPlanConfigs()
  const enabledPlans = PLAN_IDS.filter(p => configs[p].features.vagas && configs[p].vagaLimit > 0)

  const vagas = enabledPlans.length === 0 ? [] : await db.vaga.findMany({
    where: {
      active: true,
      business: {
        ownerId: { not: null },
        plan: { in: enabledPlans },
        ...(negocio ? { slug: negocio } : {}),
      },
    },
    include: {
      business: { select: { name: true, slug: true, neighborhood: true, whatsapp: true, category: { select: { slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const filterName = negocio ? vagas[0]?.business.name ?? null : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-flora-fresh">
          <Briefcase className="w-3.5 h-3.5" /> Oportunidades
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">
          {filterName ? `Vagas em ${filterName}` : "Vagas no Jardim Botânico"}
        </h1>
        <p className="mt-3 flora-muted max-w-xl mx-auto">
          {filterName
            ? "Oportunidades abertas neste comércio. Clique numa vaga para ver os detalhes e se candidatar."
            : "Trabalhe perto de casa. Clique numa vaga para ver os detalhes e se candidatar."}
        </p>
        {filterName && (
          <Link href="/vagas" className="inline-block mt-3 text-sm font-medium text-flora-green dark:text-flora-fresh hover:underline">
            Ver todas as vagas do bairro →
          </Link>
        )}
      </header>

      {vagas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-flora-green/20 dark:border-white/10 p-12 text-center">
          <Briefcase className="w-12 h-12 text-flora-green/30 dark:text-flora-fresh/30 mx-auto mb-4" />
          <p className="flora-ink font-medium">Nenhuma vaga aberta no momento.</p>
          <p className="flora-muted text-sm mt-1">Volte em breve — novas oportunidades aparecem aqui assim que os comércios publicam.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          {vagas.map(v => {
            const biz = v.business
            return (
              <Link key={v.id} href={`/vagas/${v.id}`}
                className="flora-card rounded-2xl p-5 block group hover:shadow-lg hover:shadow-flora-green/10 transition-all">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-lg font-semibold flora-ink leading-tight group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors">{v.title}</h2>
                  {v.type && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-flora-green/10 dark:bg-flora-fresh/15 text-flora-green dark:text-flora-fresh uppercase tracking-wide">
                      {v.type}
                    </span>
                  )}
                </div>
                <p className="inline-flex items-center gap-1.5 text-sm flora-muted mt-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-flora-green/60" />
                  {biz.name} · {biz.neighborhood}
                </p>
                <p className="mt-2 text-sm flora-ink/80 leading-relaxed line-clamp-3">{v.description}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-flora-green dark:text-flora-fresh group-hover:gap-2 transition-all">
                  Ver vaga <span aria-hidden>→</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
