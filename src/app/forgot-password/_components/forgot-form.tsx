"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, Loader2, CheckCircle } from "lucide-react"

export function ForgotForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      setSent(true)
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
      <p className="text-white/80 text-sm">
        Se houver uma conta com esse email, enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.
      </p>
      <Link href="/login" className="inline-block text-emerald-400 text-sm hover:underline">
        Voltar para o login
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.28)" }} />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full pl-10 pr-3 py-3 rounded-xl text-sm text-white focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : "Enviar link de recuperação"}
      </button>
      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "#10b981" }}>Entrar</Link>
      </p>
    </form>
  )
}
