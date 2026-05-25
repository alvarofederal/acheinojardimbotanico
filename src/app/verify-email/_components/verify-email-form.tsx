// src/app/verify-email/_components/verify-email-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { authInputCls, authLabelCls } from "@/components/auth-shell"

interface VerifyEmailFormProps {
  initialEmail?: string
}

const codeInputCls =
  "w-full p-4 rounded-xl text-center font-mono text-3xl font-bold tracking-[10px] flora-ink bg-flora-green/5 dark:bg-flora-fresh/10 border border-flora-green/25 dark:border-flora-fresh/30 focus:outline-none focus:ring-2 focus:ring-flora-fresh/30 transition-all"

export function VerifyEmailForm({ initialEmail }: VerifyEmailFormProps) {
  const router = useRouter()

  const [loading, setLoading]           = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown]       = useState(0)
  const [formData, setFormData]         = useState({
    email: initialEmail || "",
    code:  "",
  })

  // Countdown baseado no expiresAt salvo no localStorage
  useEffect(() => {
    const tick = () => {
      const expiry = localStorage.getItem("verificationExpiry")
      if (!expiry) { setCountdown(0); return }
      const remaining = Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000))
      setCountdown(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fallback para email do localStorage quando não vem pela URL
  useEffect(() => {
    if (!initialEmail) {
      const saved = localStorage.getItem("verificationEmail")
      if (saved) setFormData(prev => ({ ...prev, email: saved }))
    }
  }, [initialEmail])

  const fmtCountdown = (s: number) =>
    s >= 60 ? `${Math.floor(s / 60)}min ${s % 60}s` : `${s}s`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.code.length !== 6) { toast.error("O código deve ter 6 dígitos"); return }

    setLoading(true)
    try {
      const res  = await fetch("/api/verify-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: formData.email, code: formData.code }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error(data.error || "Código inválido"); setLoading(false); return }

      localStorage.removeItem("verificationExpiry")
      localStorage.removeItem("verificationEmail")
      toast.success("Email verificado com sucesso!")
      setTimeout(() => router.push("/login"), 1500)
    } catch {
      toast.error("Erro ao verificar email")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !formData.email) return
    setResendLoading(true)
    try {
      const res  = await fetch("/api/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: formData.email }),
      })
      const data = await res.json()

      if (!res.ok) { toast.error(data.error || "Erro ao reenviar"); setResendLoading(false); return }

      if (data.expiresAt) localStorage.setItem("verificationExpiry", data.expiresAt)
      toast.success("Código reenviado! Verifique seu email.")
      setResendLoading(false)
      setFormData(prev => ({ ...prev, code: "" }))
    } catch {
      toast.error("Erro ao reenviar código")
      setResendLoading(false)
    }
  }

  const canResend = countdown === 0

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className={authLabelCls}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flora-ink/30" />
            <input
              type="email"
              required
              readOnly={!!initialEmail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputCls + (initialEmail ? " opacity-70" : "")}
            />
          </div>
        </div>

        {/* Código */}
        <div>
          <label className={authLabelCls}>Código de 6 dígitos</label>
          <input
            type="text"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            value={formData.code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              setFormData({ ...formData, code: value })
            }}
            placeholder="000000"
            autoFocus
            className={codeInputCls}
          />
          <p className={`text-xs mt-2 text-center ${countdown > 0 ? "text-flora-green dark:text-flora-fresh" : "text-red-500"}`}>
            {countdown > 0
              ? `⏱ Expira em ${fmtCountdown(countdown)}`
              : "Código expirado — solicite um novo"}
          </p>
        </div>

        {/* Botão verificar */}
        <button
          type="submit"
          disabled={loading || formData.code.length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-flora-green hover:bg-flora-fresh transition-all hover:shadow-lg hover:shadow-flora-green/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Verificar email</>
          )}
        </button>
      </form>

      {/* Reenviar */}
      <div className="pt-4 text-center border-t border-flora-green/10 dark:border-white/10">
        <p className="text-xs mb-3 flora-muted">
          Não recebeu o código?
        </p>
        <button
          type="button"
          disabled={!canResend || resendLoading}
          onClick={handleResend}
          className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${canResend ? "text-flora-green dark:text-flora-fresh hover:underline" : "flora-muted"}`}
        >
          {resendLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reenviando...</>
          ) : canResend ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Reenviar Código</>
          ) : (
            `Reenviar em ${fmtCountdown(countdown)}`
          )}
        </button>
      </div>
    </div>
  )
}
