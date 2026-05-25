import Link from "next/link"
import { Newspaper } from "lucide-react"

export interface ContentItem {
  title: string
  href: string
  excerpt: string | null
  coverUrl: string | null
  meta?: string | null   // data, local, etc.
  badge?: string | null  // ex: "Hoje", "Encerrado"
}

/** Layout estilo portal: 1 destaque + 2 secundárias + lista, com "ver mais". */
export function ContentSections({
  items, moreHref, moreLabel, emptyText,
}: {
  items: ContentItem[]; moreHref: string; moreLabel: string; emptyText: string
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Newspaper className="w-12 h-12 text-flora-green/30 mx-auto mb-4" />
        <p className="font-serif text-xl flora-ink">{emptyText}</p>
      </div>
    )
  }

  const [hero, ...rest] = items
  const secondary = rest.slice(0, 2)
  const list = rest.slice(2, 7)

  return (
    <div className="space-y-8">
      {/* Destaque */}
      <Link href={hero.href} className="flora-card group block rounded-3xl overflow-hidden">
        <div className="relative aspect-[16/8] bg-flora-sand dark:bg-white/5 overflow-hidden">
          {hero.coverUrl
            ? <img src={hero.coverUrl} alt={hero.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-flora-green/15 to-flora-soft/20"><Newspaper className="w-12 h-12 text-flora-green/30" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            {hero.badge && <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink mb-2">{hero.badge}</span>}
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white leading-tight">{hero.title}</h2>
            {hero.meta && <p className="text-white/70 text-sm mt-1">{hero.meta}</p>}
            {hero.excerpt && <p className="text-white/80 text-sm mt-2 line-clamp-2 max-w-2xl">{hero.excerpt}</p>}
          </div>
        </div>
      </Link>

      {/* 2 secundárias */}
      {secondary.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-5">
          {secondary.map((it, i) => (
            <Link key={i} href={it.href} className="flora-card group rounded-2xl overflow-hidden">
              <div className="relative aspect-[16/9] bg-flora-sand dark:bg-white/5 overflow-hidden">
                {it.coverUrl
                  ? <img src={it.coverUrl} alt={it.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-8 h-8 text-flora-green/30" /></div>}
                {it.badge && <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink">{it.badge}</span>}
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg font-semibold flora-ink leading-tight group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors line-clamp-2">{it.title}</h3>
                {it.meta && <p className="text-xs flora-muted mt-1">{it.meta}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Lista */}
      {list.length > 0 && (
        <div className="divide-y divide-flora-green/[0.08] dark:divide-white/[0.06]">
          {list.map((it, i) => (
            <Link key={i} href={it.href} className="flex gap-4 py-4 group">
              <div className="w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-flora-sand dark:bg-white/5">
                {it.coverUrl
                  ? <img src={it.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-5 h-5 text-flora-green/30" /></div>}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold flora-ink leading-tight group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors line-clamp-2">{it.title}</h3>
                {it.meta && <p className="text-xs flora-muted mt-0.5">{it.meta}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-center pt-2">
        <Link href={moreHref} className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full flora-chip flora-ink text-sm font-semibold hover:gap-2.5 transition-all">
          {moreLabel}
        </Link>
      </div>
    </div>
  )
}
