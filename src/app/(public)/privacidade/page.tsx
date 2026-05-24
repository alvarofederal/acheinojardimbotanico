import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Achei no Jardim Botânico trata seus dados pessoais (LGPD).",
}

export default function PrivacidadePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mb-2">Política de Privacidade</h1>
      <p className="flora-muted text-sm mb-8">Última atualização: maio de 2026 · Em conformidade com a LGPD</p>

      <div className="space-y-6 flora-ink text-[15px] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">1. Dados que coletamos</h2>
          <p className="flora-muted">
            Coletamos o mínimo necessário: <strong className="flora-ink">nome e email</strong> ao criar
            conta. Em pagamentos, o CPF/CNPJ é tratado diretamente pelo Asaas. Não armazenamos
            dados de cartão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">2. Como usamos</h2>
          <p className="flora-muted">
            Usamos seus dados para autenticação, gestão do seu negócio no guia e comunicação
            transacional (verificação de email, avisos de reivindicação e cobrança). Não vendemos
            seus dados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">3. Negócios importados</h2>
          <p className="flora-muted">
            Dados de estabelecimentos obtidos do Google são informações públicas e comerciais, não
            dados pessoais. Ainda assim, se você for o responsável e quiser a remoção, atendemos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">4. Seus direitos (LGPD)</h2>
          <p className="flora-muted">
            Você pode acessar, corrigir ou excluir seus dados a qualquer momento. A exclusão da conta
            está disponível em <Link href="/dashboard/conta" className="text-flora-green dark:text-flora-fresh underline">Minha Conta</Link>,
            removendo seus dados pessoais de forma permanente.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-semibold">5. Segurança</h2>
          <p className="flora-muted">
            Senhas são armazenadas com criptografia forte (bcrypt). O acesso a dados é protegido e
            toda ação administrativa é registrada em log de auditoria.
          </p>
        </section>
      </div>
    </main>
  )
}
