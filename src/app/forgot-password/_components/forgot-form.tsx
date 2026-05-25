"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { authInputCls, authLabelCls } from "@/components/auth-shell"

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
      <CheckCircle className="w-14 h-14 text-flora-green dark:text-flora-fresh mx-auto" />
      <p className="flora-muted text-sm">
        Se houver uma conta com esse email, enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.
      </p>
      <Link href="/login" className="inline-block text-flora-green dark:text-flora-fresh text-sm font-semibold hover:underline">
        Voltar para o login
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={authLabelCls}>Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flora-ink/30" />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={authInputCls}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-flora-green hover:bg-flora-fresh transition-all hover:shadow-lg hover:shadow-flora-green/25 disabled:opacity-60"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : "Enviar link de recuperação"}
      </button>
      <p className="text-center text-xs flora-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-flora-green dark:text-flora-fresh hover:underline">Entrar</Link>
      </p>
    </form>
  )
}
