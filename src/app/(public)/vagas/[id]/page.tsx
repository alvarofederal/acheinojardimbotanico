import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { getPlanConfigs } from "@/lib/plan-config"
import { PLAN_IDS } from "@/lib/plans"
import { ArrowLeft, MapPin } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"
import { CopyEmail } from "./_components/copy-email"

export const revalidate = 300

// Carrega a vaga só se: ativa, negócio reivindicado e em plano com vagas liberado.
async function getVaga(id: string) {
  const configs = await getPlanConfigs()
  const enabledPlans = PLAN_IDS.filter(p => configs[p].features.vagas && configs[p].vagaLimit > 0)
  if (enabledPlans.length === 0) return null
  return db.vaga.findFirst({
    where: { id, active: true, business: { ownerId: { not: null }, plan: { in: enabledPlans } } },
    include: {
      business: { select: { name: true, slug: true, neighborhood: true, whatsapp: true, category: { select: { slug: true } } } },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const v = await getVaga(id)
  if (!v) return { title: "Vaga" }
  return {
    title: `${v.title} — ${v.business.name}`,
    description: v.description.slice(0, 155),
  }
}

export default async function VagaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const v = await getVaga(id)
  if (!v) notFound()

  const biz = v.business
  const profileHref = `/${slugify(biz.neighborhood)}/${biz.category.slug}/${biz.slug}`
  const wa = v.showWhatsapp ? biz.whatsapp?.replace(/\D/g, "") : null
  const waText = encodeURIComponent(`Olá! Vi a vaga "${v.title}" no Achei no Jardim Botânico e gostaria de me candidatar.`)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link href="/vagas" className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Todas as vagas
      </Link>

      <header>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest text-flora-fresh">Vaga</span>
          {v.type && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-flora-green/10 dark:bg-flora-fresh/15 text-flora-green dark:text-flora-fresh uppercase tracking-wide">
              {v.type}
            </span>
          )}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink leading-tight mt-2">{v.title}</h1>
        <Link href={profileHref} className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mt-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-flora-green/60" />
          {biz.name} · {biz.neighborhood}
        </Link>
      </header>

      <article className="mt-6 flora-card rounded-3xl p-6">
        <p className="flora-ink/90 leading-relaxed whitespace-pre-wrap">{v.description}</p>
      </article>

      {(wa || v.email) && (
        <div className="mt-6">
          <p className="text-sm font-semibold flora-ink mb-2.5">Candidatar-se</p>
          <div className="flex flex-wrap items-center gap-2">
            {wa && (
              <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-flora-green/25">
                <WhatsappIcon className="w-4 h-4" /> Candidatar via WhatsApp
              </a>
            )}
            {v.email && <CopyEmail email={v.email} />}
          </div>
          {v.email && <p className="text-[11px] flora-muted mt-2">Clique no e-mail para copiar e enviar sua candidatura.</p>}
        </div>
      )}
    </div>
  )
}
