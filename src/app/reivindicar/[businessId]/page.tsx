"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Loader2, CheckCircle, ArrowLeft, Mail, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { MonsteraLeaf, FernFrond } from "@/app/(public)/_components/botanicals"
import { useSession } from "next-auth/react"

type Step = "send-code" | "verify-code" | "form" | "done"

export default function ClaimPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<{ name: string } | null>(null)
  const [step, setStep] = useState<Step>("send-code")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consent, setConsent] = useState(false)
  const [code, setCode] = useState("")
  const [form, setForm] = useState({ message: "", cnpj: "", verificationCode: "" })

  useEffect(() => {
    fetch(`/api/business/${businessId}`)
      .then(r => r.json())
      .then(d => setBusiness(d))
      .catch(() => {})
  }, [businessId])

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/reivindicar/${businessId}`)
    }
  }, [status, businessId, router])

  async function handleSendCode() {
    setSending(true)
    try {
      const res = await fetch("/api/claims/send-code", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao enviar código"); return }
      toast.success("Código enviado! Verifique seu email.")
      setStep("verify-code")
    } catch {
      toast.error("Erro de rede")
    } finally {
      setSending(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { toast.error("Digite os 6 dígitos do código"); return }
    setVerifying(true)
    // Verificação acontece no submit final — aqui só avançamos para o formulário
    setForm(f => ({ ...f, verificationCode: code }))
    setStep("form")
    setVerifying(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { toast.error("É preciso aceitar os Termos e a Política de Privacidade"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Código expirado — volta para o início
        if (res.status === 400 && data.error?.includes("Código")) {
          toast.error(data.error)
          setStep("send-code")
          setCode("")
          setForm(f => ({ ...f, verificationCode: "" }))
          return
        }
        if (res.status === 401) {
          toast.error("Faça login para reivindicar")
          router.push(`/login?callbackUrl=/reivindicar/${businessId}`)
          return
        }
        toast.error(data.error ?? "Erro ao enviar")
        return
      }
      setStep("done")
    } catch {
      toast.error("Erro de rede")
    } finally {
      setSubmitting(false)
    }
  }

  const email = session?.user?.email ?? ""

  if (status === "loading") return null

  if (step === "done") return (
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

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["send-code", "verify-code", "form"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? "bg-flora-green text-white" :
                (["send-code", "verify-code", "form"].indexOf(step) > i) ? "bg-flora-green/30 text-flora-green dark:text-flora-fresh" :
                "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30"
              }`}>{i + 1}</div>
              {i < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="flora-card rounded-3xl p-6">

          {/* Etapa 1 — enviar código */}
          {step === "send-code" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-flora-green/5 dark:bg-flora-fresh/5 border border-flora-green/15 dark:border-flora-fresh/15">
                <Mail className="w-5 h-5 text-flora-green dark:text-flora-fresh mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold flora-ink">Confirme sua identidade</p>
                  <p className="text-xs flora-muted mt-0.5">
                    Enviaremos um código de 6 dígitos para o email da sua conta:
                  </p>
                  <p className="text-sm font-semibold text-flora-green dark:text-flora-fresh mt-1">{email}</p>
                </div>
              </div>
              <button
                onClick={handleSendCode}
                disabled={sending}
                className="w-full py-3 rounded-full bg-flora-green hover:bg-flora-fresh disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25 flex items-center justify-center gap-2"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar código por email"}
              </button>
            </div>
          )}

          {/* Etapa 2 — digitar código */}
          {step === "verify-code" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <p className="text-sm flora-muted text-center mb-1">
                  Código enviado para <strong className="flora-ink">{email}</strong>
                </p>
                <p className="text-xs text-center flora-muted">Válido por 15 minutos</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide flora-muted flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-flora-green/15 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-center text-2xl font-bold tracking-[0.5em] flora-ink placeholder:text-flora-ink/20 focus:outline-none focus:border-flora-fresh focus:ring-2 focus:ring-flora-fresh/30 transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="w-full py-3 rounded-full bg-flora-green hover:bg-flora-fresh disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25 flex items-center justify-center gap-2"
              >
                {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : "Confirmar código"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("send-code"); setCode("") }}
                className="w-full text-xs flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors"
              >
                Não recebeu? Reenviar código
              </button>
            </form>
          )}

          {/* Etapa 3 — formulário */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Email verificado com sucesso</p>
              </div>

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
                disabled={submitting || !consent}
                className="w-full py-3 rounded-full bg-flora-green hover:bg-flora-fresh disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar solicitação"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
