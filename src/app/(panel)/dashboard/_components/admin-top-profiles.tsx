import Link from "next/link"
import { Eye, MessageCircle, ExternalLink } from "lucide-react"

export interface TopRow { name: string; href: string; count: number }

function Block({ title, icon: Icon, color, rows, unit }: { title: string; icon: typeof Eye; color: string; rows: TopRow[]; unit: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold dash-title flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} /> {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs dash-muted py-4 text-center">Ainda sem dados nos últimos 7 dias.</p>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-white/[0.04]">
          {rows.map((r, i) => (
            <li key={r.href}>
              <Link href={r.href} target="_blank" className="flex items-center gap-2 py-2 group">
                <span className="text-xs dash-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                <span className="text-sm dash-title truncate flex-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{r.name}</span>
                <span className={`text-sm font-bold ${color} flex-shrink-0`}>{r.count}</span>
                <span className="text-[11px] dash-muted flex-shrink-0">{unit}</span>
                <ExternalLink className="w-3 h-3 dash-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Painel de follow-up: quais negócios estão recebendo tráfego/contatos. */
export function AdminTopProfiles({ views, clicks }: { views: TopRow[]; clicks: TopRow[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold dash-title mb-3">Atividade dos negócios (7 dias)</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Block title="Perfis mais vistos" icon={Eye} color="text-blue-500 dark:text-blue-400" rows={views} unit="views" />
        <Block title="Mais contatos no WhatsApp" icon={MessageCircle} color="text-emerald-500 dark:text-emerald-400" rows={clicks} unit="cliques" />
      </div>
      <p className="text-[11px] dash-muted mt-2">Dica de venda: se um negócio que você contatou aparecer aqui, é o momento de fazer o follow-up. 🌿</p>
    </div>
  )
}
