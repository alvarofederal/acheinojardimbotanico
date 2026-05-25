"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2, Mail, Lock, Chrome } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const inputCls = "w-full pl-10 pr-3 py-3 rounded-xl text-sm flora-ink bg-white/70 dark:bg-white/[0.04] border border-flora-green/15 dark:border-white/10 placeholder:text-flora-ink/30 focus:outline-none focus:border-flora-fresh focus:ring-2 focus:ring-flora-fresh/30 transition-all"
const labelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide flora-muted"

/** Só aceita caminhos internos (evita open redirect). */
function safeCallbackUrl(): string {
  if (typeof window === "undefined") return "/dashboard"
  const cb = new URLSearchParams(window.location.search).get("callbackUrl")
  if (cb && cb.startsWith("/") && !cb.startsWith("//")) return cb
  return "/dashboard"
}

export function LoginForm() {
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData]         = useState({ email: "", password: "" })
  const [focused, setFocused]           = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/login-and-redirect", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          toast.error("Email não verificado", {
            description: "Verifique sua caixa de entrada.",
            action: {
              label: "Reenviar código",
              onClick: () => (window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`),
            },
          })
        } else {
          toast.error(data.error || "Email ou senha incorretos")
        }
        setLoading(false)
        return
      }
      toast.success("Login realizado!")
      window.location.href = safeCallbackUrl()
    } catch {
      toast.error("Erro ao fazer login")
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: safeCallbackUrl(), redirect: true })
    } catch {
      toast.error("Erro ao fazer login com Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold flora-chip flora-ink transition-all disabled:opacity-50"
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4 text-flora-green dark:text-flora-fresh" />}
        Continuar com Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-flora-green/10 dark:bg-white/10" />
        <span className="text-xs flora-muted">ou</span>
        <div className="flex-1 h-px bg-flora-green/10 dark:bg-white/10" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Email</label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === "email" ? "text-flora-green dark:text-flora-fresh" : "text-flora-ink/30"}`} />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              placeholder="seu@email.com"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Senha</label>
            <Link href="/forgot-password" className="text-xs flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors">
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused === "password" ? "text-flora-green dark:text-flora-fresh" : "text-flora-ink/30"}`} />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-flora-green hover:bg-flora-fresh transition-all hover:shadow-lg hover:shadow-flora-green/25 disabled:opacity-60 mt-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : "Entrar"}
        </button>
      </form>
    </div>
  )
}
