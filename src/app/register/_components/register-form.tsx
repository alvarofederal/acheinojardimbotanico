"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, Chrome, User } from "lucide-react"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { authInputCls, authLabelCls } from "@/components/auth-shell"

const iconCls = (active: boolean) =>
  `absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${active ? "text-flora-green dark:text-flora-fresh" : "text-flora-ink/30"}`

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading]             = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [focused, setFocused]             = useState<string | null>(null)
  const [formData, setFormData]           = useState({
    name: "", email: "", password: "", confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }
    if (formData.password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres")
      return
    }
    setLoading(true)
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar conta")
        setLoading(false)
        return
      }
      if (data.devAutoVerified) {
        toast.success("Conta criada! Redirecionando...")
        router.push("/login")
        return
      }
      if (data.expiresAt) {
        localStorage.setItem("verificationExpiry", data.expiresAt)
        localStorage.setItem("verificationEmail", formData.email)
      }
      toast.success("Conta criada! Verifique seu email.")
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch {
      toast.error("Erro ao criar conta")
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  const field = (id: string) => ({
    onFocus: () => setFocused(id),
    onBlur:  () => setFocused(null),
    className: authInputCls,
  })

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
        Cadastrar com Google
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
          <label className={authLabelCls}>Nome</label>
          <div className="relative">
            <User className={iconCls(focused === "name")} />
            <input type="text" required placeholder="Seu nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              {...field("name")} />
          </div>
        </div>

        <div>
          <label className={authLabelCls}>Email</label>
          <div className="relative">
            <Mail className={iconCls(focused === "email")} />
            <input type="email" required placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              {...field("email")} />
          </div>
        </div>

        <div>
          <label className={authLabelCls}>Senha</label>
          <div className="relative">
            <Lock className={iconCls(focused === "password")} />
            <input type="password" required minLength={8} placeholder="Mín. 8 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              {...field("password")} />
          </div>
          <p className="text-xs mt-1 flora-muted">
            Mín. 8 caracteres, com maiúscula, número e símbolo
          </p>
        </div>

        <div>
          <label className={authLabelCls}>Confirmar senha</label>
          <div className="relative">
            <Lock className={iconCls(focused === "confirm")} />
            <input type="password" required placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              {...field("confirm")} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white bg-flora-green hover:bg-flora-fresh transition-all hover:shadow-lg hover:shadow-flora-green/25 disabled:opacity-60 mt-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : "Criar conta grátis"}
        </button>

        <p className="text-center text-xs leading-relaxed flora-muted">
          Ao criar conta, você concorda com os{" "}
          <a href="/termos" target="_blank" className="text-flora-green dark:text-flora-fresh hover:underline">Termos de Uso</a>{" "}
          e a{" "}
          <a href="/privacidade" target="_blank" className="text-flora-green dark:text-flora-fresh hover:underline">Política de Privacidade</a>.
        </p>
      </form>
    </div>
  )
}
