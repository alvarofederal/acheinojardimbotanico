/** Skeletons reutilizáveis — Flora. */

function CardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-flora-green/[0.06] bg-white/40 dark:bg-white/[0.02]">
      <div className="flora-skeleton aspect-[16/10] rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="flora-skeleton h-5 w-3/4" />
        <div className="flora-skeleton h-3.5 w-1/3" />
        <div className="flora-skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flora-skeleton h-3 w-48" />
      <div className="flora-skeleton rounded-3xl w-full" style={{ height: "min(70vw, 460px)" }} />
      <div className="space-y-3">
        <div className="flora-skeleton h-4 w-28" />
        <div className="flora-skeleton h-10 w-2/3" />
        <div className="flora-skeleton h-4 w-40" />
      </div>
      <div className="flex gap-3">
        <div className="flora-skeleton h-11 w-40 rounded-full" />
        <div className="flora-skeleton h-11 w-36 rounded-full" />
        <div className="flora-skeleton h-11 w-28 rounded-full" />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="flora-skeleton h-32 rounded-3xl" />
        <div className="flora-skeleton h-32 rounded-3xl" />
      </div>
    </div>
  )
}
