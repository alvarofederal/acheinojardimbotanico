"use client"

import { useState } from "react"
import { PLACE_TYPES_TO_IMPORT, CATEGORY_MAP } from "@/lib/places"
import { Loader2, Download, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

// Centro padrão: BAIRRO Jardim Botânico DF (Comércio do JB, ao lado do Lago Sul)
// Não confundir com o Parque/Jardim Botânico nem com o Aeroporto.
const DEFAULT_LAT = -15.8794145
const DEFAULT_LNG = -47.8105738
const DEFAULT_RADIUS = 3000

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: number
  details: Array<{ name: string; status: string; error?: string }>
}

export default function ImportPage() {
  const [lat, setLat]         = useState(DEFAULT_LAT.toString())
  const [lng, setLng]         = useState(DEFAULT_LNG.toString())
  const [radius, setRadius]   = useState(DEFAULT_RADIUS.toString())
  const [maxPer, setMaxPer]   = useState("20")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([...PLACE_TYPES_TO_IMPORT])
  const [textQueries, setTextQueries] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<ImportResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  function toggleType(type: string) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function selectAll()   { setSelectedTypes([...PLACE_TYPES_TO_IMPORT]) }
  function deselectAll() { setSelectedTypes([]) }

  async function handleImport() {
    const queries = textQueries.split(/[\n,]/).map(q => q.trim()).filter(q => q.length >= 2)
    if (selectedTypes.length === 0 && queries.length === 0) {
      setError("Selecione ao menos um tipo ou informe um termo de busca.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radiusMeters: parseInt(radius),
          types: selectedTypes,
          maxPerType: parseInt(maxPer),
          textQueries: queries,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao importar")
        return
      }

      setResult(data)
    } catch {
      setError("Erro de rede. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Importar Negócios</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          Busca negócios no Google Places e salva no banco. Re-importar atualiza os dados sem duplicar.
        </p>
      </div>

      {/* Parâmetros */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">Parâmetros de busca</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs dash-muted">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs dash-muted">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs dash-muted">Raio (metros)</label>
            <input
              type="number"
              min={100}
              max={10000}
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs dash-muted">Máx. por tipo (1–20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxPer}
              onChange={e => setMaxPer(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Tipos */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold dash-title">
            Tipos de negócio{" "}
            <span className="text-xs font-normal dash-muted">({selectedTypes.length}/{PLACE_TYPES_TO_IMPORT.length})</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={selectAll}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
              Todos
            </button>
            <span className="text-gray-300 dark:text-white/20">|</span>
            <button onClick={deselectAll}
              className="text-xs dash-muted hover:underline">
              Nenhum
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PLACE_TYPES_TO_IMPORT.map(type => {
            const active = selectedTypes.includes(type)
            const cat = CATEGORY_MAP[type]
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-emerald-50 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "text-gray-500 dark:text-white/35 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                }`}>
                {cat?.name ?? type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Busca por texto — negócios menores */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold dash-title">Negócios menores (busca por texto)</h2>
          <p className="text-xs dash-muted mt-0.5">
            Ateliês, MEIs e negócios em casa que não aparecem por tipo. Um termo por linha
            (ex: <em>Arte e Tradição</em>, <em>artesanato</em>, <em>doces caseiros</em>).
          </p>
        </div>
        <textarea
          value={textQueries}
          onChange={e => setTextQueries(e.target.value)}
          rows={3}
          placeholder={"Arte e Tradição\nartesanato Jardim Botânico\nbolos caseiros"}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Botão */}
      <button
        onClick={handleImport}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importando... (pode levar 1–2 min)
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Iniciar importação
          </>
        )}
      </button>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5 space-y-4">
          <h2 className="text-sm font-semibold dash-title flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Importação concluída
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Importados", value: result.imported, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Atualizados", value: result.updated, color: "text-blue-600 dark:text-blue-400" },
              { label: "Ignorados",  value: result.skipped,  color: "text-gray-500 dark:text-white/40" },
              { label: "Erros",      value: result.errors,   color: "text-red-600 dark:text-red-400" },
            ].map(stat => (
              <div key={stat.label}
                className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs dash-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Detalhes */}
          {result.details.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {result.details.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
                  <span className={`w-16 flex-shrink-0 font-medium ${
                    d.status === "imported" ? "text-emerald-600 dark:text-emerald-400" :
                    d.status === "updated"  ? "text-blue-600 dark:text-blue-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {d.status === "imported" ? "novo" : d.status === "updated" ? "atualizado" : "erro"}
                  </span>
                  <span className="dash-subtitle truncate flex-1">{d.name}</span>
                  {d.error && <span className="text-red-500 dark:text-red-400 truncate max-w-[200px]">{d.error}</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setResult(null); setError(null) }}
            className="flex items-center gap-1.5 text-xs dash-muted hover:dash-subtitle transition-colors">
            <RefreshCw className="w-3 h-3" />
            Nova importação
          </button>
        </div>
      )}
    </div>
  )
}
