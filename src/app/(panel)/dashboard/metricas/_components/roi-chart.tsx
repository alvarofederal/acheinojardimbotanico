interface DayPoint { label: string; views: number; clicks: number }

export function RoiChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.views, d.clicks)))

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold dash-title">Últimos 14 dias</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 dash-muted"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400" /> Visualizações</span>
          <span className="flex items-center gap-1.5 dash-muted"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> WhatsApp</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5" style={{ height: "160px" }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: "130px" }}>
              <div className="w-1/2 rounded-t bg-blue-400/80 transition-all group-hover:bg-blue-500"
                style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views > 0 ? "3px" : "0" }} />
              <div className="w-1/2 rounded-t bg-emerald-500/80 transition-all group-hover:bg-emerald-600"
                style={{ height: `${(d.clicks / max) * 100}%`, minHeight: d.clicks > 0 ? "3px" : "0" }} />
            </div>
            <span className="text-[9px] dash-muted">{d.label}</span>
            {/* tooltip */}
            <div className="absolute -top-10 hidden group-hover:flex flex-col items-center px-2 py-1 rounded-lg bg-gray-900 text-white text-[10px] whitespace-nowrap z-10">
              <span>{d.views} views</span>
              <span>{d.clicks} WhatsApp</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
