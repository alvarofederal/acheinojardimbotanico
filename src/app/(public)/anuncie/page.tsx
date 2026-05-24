import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { MonsteraLeaf, LeafSprig, SimpleLeaf } from "../_components/botanicals"
import {
  ArrowRight, Search, MessageCircle, BarChart3, ShieldCheck, Zap, Crown,
  Check, MapPin,
} from "lucide-react"
import { priceCentsFor, formatBRL } from "@/lib/plans"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Anuncie seu negócio",
  description: "Coloque seu negócio no guia do Jardim Botânico e seja encontrado por quem mora e circula pela região todos os dias. Planos a partir de R$79/mês.",
}

const STEPS = [
  { icon: ShieldCheck, title: "Reivindique seu perfil", desc: "Seu negócio provavelmente já está aqui. Encontre e reivindique em minutos." },
  { icon: Search, title: "Apareça nas buscas", desc: "Moradores procuram por categoria e encontram você com foto, horário e contato." },
  { icon: MessageCircle, title: "Receba clientes", desc: "Botão de WhatsApp direto no seu perfil. O contato chega na sua mão." },
]

const PLANS = [
  {
    id: "FREE", name: "Free", price: "Grátis", icon: ShieldCheck,
    accent: "text-flora-ink", ring: "border-flora-green/10",
    features: ["Perfil no guia", "Endereço e telefone", "Aparece nas buscas"],
    cta: "Começar grátis", highlight: false,
  },
  {
    id: "VISIBILITY", name: "Visibilidade", price: "R$ 79", per: "/mês", icon: Zap,
    accent: "text-flora-green", ring: "border-flora-fresh/40",
    features: ["Destaque na listagem", "Descrição personalizada", "Até 6 fotos", "Métricas detalhadas", "Selo Destaque"],
    cta: "Assinar Visibilidade", highlight: true,
  },
  {
    id: "PREMIUM", name: "Premium", price: "R$ 197", per: "/mês", icon: Crown,
    accent: "text-flora-earth", ring: "border-flora-gold/50",
    features: ["Topo garantido na busca", "Até 20 fotos", "Todas as métricas", "Selo Premium", "Suporte prioritário"],
    cta: "Assinar Premium", highlight: false,
  },
]

export default async function AnunciePage() {
  const [totalBusinesses, config] = await Promise.all([
    db.business.count({ where: { status: { in: ["IMPORTED", "CLAIMED"] } } }),
    db.paymentConfig.findUnique({ where: { id: "default" } }),
  ])
  const priceById: Record<string, string> = {
    FREE: "Grátis",
    VISIBILITY: formatBRL(priceCentsFor("VISIBILITY", config)),
    PREMIUM: formatBRL(priceCentsFor("PREMIUM", config)),
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative flora-hero overflow-hidden">
        <MonsteraLeaf className="absolute -left-16 top-6 w-72 h-72 text-flora-fresh/20 flora-wind" />
        <LeafSprig className="absolute right-[6%] -top-4 w-28 h-72 text-flora-soft/25 flora-wind hidden sm:block" style={{ animationDelay: "1s" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-24 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/15 mb-6">
            <MapPin className="w-3 h-3" /> Para comerciantes do Jardim Botânico
          </span>
          <h1 className="font-serif font-semibold text-white leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}>
            Seja <span className="italic text-flora-gold">encontrado</span> por quem
            <br />mora pertinho de você
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/75 max-w-xl mx-auto">
            Todo dia gente do bairro procura no Google por restaurantes, serviços e lojas.
            Coloque seu negócio onde eles procuram.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 mt-9 px-8 py-4 rounded-full bg-white text-flora-green font-semibold text-sm hover:bg-flora-gold hover:text-flora-ink transition-all hover:shadow-2xl hover:-translate-y-0.5">
            Cadastrar meu negócio grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: "52px" }}>
          <path d="M0,45 C240,90 480,10 720,35 C960,60 1200,20 1440,40 L1440,90 L0,90 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-flora-fresh">
            <SimpleLeaf className="w-3.5 h-4" /> Simples assim
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">Como funciona</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flora-card rounded-3xl p-7 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-flora-green/[0.08] dark:bg-flora-fresh/15 mx-auto mb-5">
                <s.icon className="w-6 h-6 text-flora-green dark:text-flora-fresh" strokeWidth={1.7} />
              </div>
              <div className="text-xs font-bold text-flora-gold mb-1">PASSO {i + 1}</div>
              <h3 className="font-serif text-xl font-semibold flora-ink mb-2">{s.title}</h3>
              <p className="text-sm flora-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Por que */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Search, t: "SEO local de verdade", d: "Cada perfil é otimizado para aparecer no Google quando buscam pela região." },
            { icon: MessageCircle, t: "Contato direto", d: "Cliente fala com você no WhatsApp num toque, sem intermediário." },
            { icon: BarChart3, t: "Você no controle", d: "Veja quantas pessoas visualizaram e clicaram no seu negócio." },
          ].map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-flora-green/[0.08] dark:bg-flora-fresh/15 flex-shrink-0">
                <b.icon className="w-5 h-5 text-flora-green dark:text-flora-fresh" strokeWidth={1.7} />
              </div>
              <div>
                <h3 className="font-semibold flora-ink">{b.t}</h3>
                <p className="text-sm flora-muted mt-0.5 leading-relaxed">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink">Planos para todo tamanho</h2>
          <p className="flora-muted text-sm mt-2">Comece grátis. Cresça quando quiser. Cancele quando precisar.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 items-start">
          {PLANS.map(p => (
            <div key={p.id} className={`flora-card rounded-3xl p-7 border-2 ${p.ring} ${p.highlight ? "sm:-mt-3 sm:pb-10" : ""}`}>
              {p.highlight && (
                <div className="text-center -mt-1 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-flora-green text-white">Mais popular</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <p.icon className={`w-5 h-5 ${p.accent}`} />
                <span className="font-serif text-xl font-semibold flora-ink">{p.name}</span>
              </div>
              <div className="flex items-end gap-1 mb-5">
                <span className="font-serif text-4xl font-bold flora-ink">{priceById[p.id]}</span>
                {p.per && <span className="flora-muted text-sm mb-1">{p.per}</span>}
              </div>
              <ul className="space-y-2.5 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm flora-ink">
                    <Check className="w-4 h-4 text-flora-green dark:text-flora-fresh flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className={`block text-center py-3 rounded-full text-sm font-semibold transition-all ${
                  p.highlight
                    ? "bg-flora-green hover:bg-flora-fresh text-white hover:shadow-lg"
                    : "flora-chip flora-ink"
                }`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs flora-muted mt-6">Pagamento por PIX, cartão ou boleto · Sem fidelidade</p>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] flora-hero p-10 sm:p-14 text-center">
          <MonsteraLeaf className="absolute -top-6 -right-6 w-40 h-40 text-flora-fresh/20 flora-wind" />
          <h2 className="relative font-serif text-3xl sm:text-4xl font-semibold text-white">
            {totalBusinesses > 0 ? <>Junte-se a <span className="italic text-flora-gold">{totalBusinesses}</span> negócios da região</> : <>Comece <span className="italic text-flora-gold">hoje</span></>}
          </h2>
          <p className="relative mt-3 text-white/75 max-w-md mx-auto">
            Leva poucos minutos para colocar seu negócio no mapa do Jardim Botânico.
          </p>
          <Link href="/register"
            className="relative inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full bg-white text-flora-green font-semibold text-sm hover:bg-flora-gold hover:text-flora-ink transition-all hover:shadow-2xl hover:-translate-y-0.5">
            Cadastrar meu negócio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
