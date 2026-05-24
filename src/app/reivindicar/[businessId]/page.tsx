"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Solicitação enviada!</h1>
        <p className="text-gray-500 dark:text-white/50 mb-6">
          Analisaremos sua reivindicação em até 48h e enviaremos um email com o resultado.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">
          Voltar ao início
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reivindicar negócio</h1>
          {business && (
            <p className="text-gray-500 dark:text-white/50 mt-1">
              Você está reivindicando: <strong className="text-gray-700 dark:text-white/70">{business.name}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">
              CNPJ (opcional)
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">
              Como podemos verificar que o negócio é seu?
            </label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={4}
              placeholder="Ex: Sou o proprietário desde 2020, meu telefone de contato é (61) 99999-9999..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 flex-shrink-0"
            />
            <span className="text-xs text-gray-500 dark:text-white/40 leading-relaxed">
              Declaro ser o responsável por este negócio e aceito os{" "}
              <Link href="/termos" target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:underline">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-emerald-600 dark:text-emerald-400 hover:underline">Política de Privacidade</Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !consent}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar solicitação"}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-white/30">
            Precisa ter conta para reivindicar.{" "}
            <Link href={`/login?callbackUrl=/reivindicar/${businessId}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
