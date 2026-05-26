"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { MonsteraLeaf, FernFrond } from "@/app/(public)/_components/botanicals"

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [consent, setConsent] = useState(false)
  const [form, setForm] = useState({ message: "", cnpj: "" })

  useEffect(() => {
    fetch(`/api/business/${businessId}`)
      .then(r => r.json())
      .then(d => setBusiness(d))
      .catch(() => {})
  }, [businessId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { toast.error("É preciso aceitar os Termos e a Política de Privacidade"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Faça login para reivindicar")
          router.push(`/login?callbackUrl=/reivindicar/${businessId}`)
          return
        }
        toast.error(data.error ?? "Erro ao enviar")
        return
      }
      setDone(true)
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <main className="min-h-screen flora-bg flex items-center justify-center px-4 relative overflow-hidden">
      <MonsteraLeaf className="absolute -left-16 -top-10 w-64 h-64 text-flora-green/10 dark:text-flora-fresh/10 flora-wind" />
      <FernFrond className="absolute right-[6%] -bottom-10 w-24 h-64 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "1.5s" }} />
      <div className="relative text-center max-w-md flora-card rounded-3xl p-8 z-10">
        <CheckCircle className="w-16 h-16 text-flora-green dark:text-flora-fresh mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-semibold flora-ink mb-2">Solicitação enviada! 🌿</h1>
        <p className="flora-muted mb-6">
          Analisaremos sua reivindicação em até 48h e enviaremos um email com o resultado.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flora-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <MonsteraLeaf className="absolute -left-16 -top-10 w-64 h-64 text-flora-green/10 dark:text-flora-fresh/10 flora-wind" />
      <FernFrond className="absolute right-[6%] -bottom-10 w-24 h-64 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "1.5s" }} />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-7">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-flora-green/10 dark:bg-flora-fresh/15 mb-3">
            <ShieldCheck className="w-7 h-7 text-flora-green dark:text-flora-fresh" strokeWidth={1.8} />
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink">Reivindicar negócio</h1>
          {business && (
            <p className="flora-muted mt-1.5">
              Você está reivindicando: <strong className="flora-ink">{business.name}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flora-card rounded-3xl p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide flora-muted">
              CNPJ (opcional)
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-2.5 rounded-xl border border-flora-green/15 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-sm flora-ink placeholder:text-flora-ink/30 focus:outline-none focus:border-flora-fresh focus:ring-2 focus:ring-flora-fresh/30 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide flora-muted">
              Como podemos verificar que o negócio é seu?
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              placeholder="Ex: Sou o proprietário desde 2020, meu telefone de contato é (61) 99999-9999..."
              className="w-full px-4 py-2.5 rounded-xl border border-flora-green/15 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-sm flora-ink placeholder:text-flora-ink/30 focus:outline-none focus:border-flora-fresh focus:ring-2 focus:ring-flora-fresh/30 transition-all resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-flora-green flex-shrink-0"
            />
            <span className="text-xs flora-muted leading-relaxed">
              Declaro ser o responsável por este negócio e aceito os{" "}
              <Link href="/termos" target="_blank" className="text-flora-green dark:text-flora-fresh hover:underline">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-flora-green dark:text-flora-fresh hover:underline">Política de Privacidade</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !consent}
            className="w-full py-3 rounded-full bg-flora-green hover:bg-flora-fresh disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar solicitação"}
          </button>

          <p className="text-xs text-center flora-muted">
            Precisa ter conta para reivindicar.{" "}
            <Link href={`/login?callbackUrl=/reivindicar/${businessId}`} className="text-flora-green dark:text-flora-fresh font-semibold hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
