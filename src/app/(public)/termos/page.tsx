import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do Achei no Jardim Botânico.",
}

export default function TermosPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mb-2">Termos de Uso</h1>
      <p className="flora-muted text-sm mb-8">Última atualização: maio de 2026</p>

      <div className="space-y-6 flora-ink text-[15px] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">1. Sobre o serviço</h2>
          <p className="flora-muted">
            O Achei no Jardim Botânico é um guia comercial digital que reúne informações de
            estabelecimentos da região do Jardim Botânico (DF). Parte dos dados é obtida de
            fontes públicas, como o Google Places, e exibida com a devida atribuição.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">2. Cadastro e reivindicação</h2>
          <p className="flora-muted">
            Comerciantes podem criar conta e reivindicar o perfil do seu negócio. Ao fazê-lo,
            você declara ser o responsável legal pelo estabelecimento e concorda em fornecer
            informações verdadeiras. Reivindicações passam por análise.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">3. Planos e pagamentos</h2>
          <p className="flora-muted">
            Oferecemos planos pagos de destaque (Visibilidade e Premium), com cobrança
            recorrente mensal processada pelo Asaas. O cancelamento pode ser feito a qualquer
            momento; o plano permanece ativo até o fim do período já pago.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">4. Conteúdo e responsabilidade</h2>
          <p className="flora-muted">
            As informações dos perfis são de responsabilidade de cada estabelecimento. Não nos
            responsabilizamos por imprecisões em dados de terceiros, mas trabalhamos para mantê-los
            atualizados. Conteúdo abusivo pode ser removido.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">5. Contato</h2>
          <p className="flora-muted">
            Dúvidas sobre estes termos? Fale conosco pelo email de suporte informado no site.
          </p>
        </section>
      </div>
    </main>
  )
}
