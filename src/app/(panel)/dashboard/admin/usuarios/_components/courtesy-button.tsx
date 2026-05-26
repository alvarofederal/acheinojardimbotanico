"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Gift, Loader2, X } from "lucide-react"

const PRESETS = [1, 3, 6, 12]

export function CourtesyButton({
  businessId, businessName, currentPlan, isCourtesy,
}: {
  businessId: string; businessName: string; currentPlan: string; isCourtesy: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<"VISIBILITY" | "PREMIUM">("PREMIUM")
  const [months, setMonths] = useState(1)
  const [custom, setCustom] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const finalMonths = custom ? Math.max(1, Math.min(36, parseInt(custom, 10) || 0)) : months

  async function grant() {
    if (!finalMonths) { toast.error("Informe os meses"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/cortesia", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, plan, months: finalMonths, note: note || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(`Cortesia de ${finalMonths} ${finalMonths === 1 ? "mês" : "meses"} concedida!`)
      setOpen(false); setNote(""); setCustom("")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
        <Gift className="w-3.5 h-3.5" /> Cortesia
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500" /> Liberar cortesia</h3>
                <p className="text-xs dash-muted mt-0.5">{businessName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>

            {isCourtesy && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2.5">
                Este negócio já está em cortesia ({currentPlan}). Conceder de novo <strong>estende</strong> o prazo.
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Plano</label>
              <div className="flex gap-2">
                {(["VISIBILITY", "PREMIUM"] as const).map(p => (
                  <button key={p} onClick={() => setPlan(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${plan === p ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}>
                    {p === "PREMIUM" ? "Premium" : "Visibilidade"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Duração</label>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(m => (
                  <button key={m} onClick={() => { setMonths(m); setCustom("") }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${!custom && months === m ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}>
                    {m} {m === 1 ? "mês" : "meses"}
                  </button>
                ))}
                <input type="number" min="1" max="36" value={custom} onChange={e => setCustom(e.target.value)}
                  placeholder="Outro"
                  className="w-20 px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Motivo (só você vê)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: amigo da capela, indicação..."
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-500/[0.07] p-3 text-xs text-amber-800 dark:text-amber-300">
              O lojista verá <strong>{plan === "PREMIUM" ? "Premium" : "Visibilidade"} ativo por {finalMonths || "—"} {finalMonths === 1 ? "mês" : "meses"}</strong>.
              No seu financeiro, isso <strong>não conta como receita</strong> (R$0).
            </div>

            <button onClick={grant} disabled={saving}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Conceder cortesia
            </button>
          </div>
        </div>
      )}
    </>
  )
}
