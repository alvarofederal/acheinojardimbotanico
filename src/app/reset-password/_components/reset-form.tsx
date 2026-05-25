"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Lock, Loader2, CheckCircle } from "lucide-react"
import { authInputCls, authLabelCls } from "@/components/auth-shell"

export function ResetForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error("As senhas não coincidem"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      setDone(true)
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <p className="text-center text-sm text-red-500">
      Link inválido. <Link href="/forgot-password" className="text-flora-green dark:text-flora-fresh font-semibold hover:underline">Solicitar novo</Link>
    </p>
  )

  if (done) return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-14 h-14 text-flora-green dark:text-flora-fresh mx-auto" />
      <p className="flora-muted text-sm">Senha redefinida! Redirecionando para o login...</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={authLabelCls}>Nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flora-ink/30" />
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mín. 8 caracteres" className={authInputCls} />
        </div>
      </div>
      <div>
        <label className={authLabelCls}>Confirmar senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-flora-ink/30" />
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" className={authInputCls} />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-flora-green hover:bg-flora-fresh transition-all hover:shadow-lg hover:shadow-flora-green/25 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Redefinindo...</> : "Redefinir senha"}
      </button>
    </form>
  )
}
