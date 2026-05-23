"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Lock, Loader2, CheckCircle } from "lucide-react"

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
    <p className="text-center text-sm text-red-400">
      Link inválido. <Link href="/forgot-password" className="text-emerald-400 hover:underline">Solicitar novo</Link>
    </p>
  )

  if (done) return (
    <div className="text-center space-y-4">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
      <p className="text-white/80 text-sm">Senha redefinida! Redirecionando para o login...</p>
    </div>
  )

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.28)" }} />
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mín. 8 caracteres" className="w-full pl-10 pr-3 py-3 rounded-xl text-sm text-white focus:outline-none" style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Confirmar senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.28)" }} />
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" className="w-full pl-10 pr-3 py-3 rounded-xl text-sm text-white focus:outline-none" style={inputStyle} />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Redefinindo...</> : "Redefinir senha"}
      </button>
    </form>
  )
}
