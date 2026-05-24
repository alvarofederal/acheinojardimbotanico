import { CardGridSkeleton } from "../../_components/skeletons"

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-3">
        <div className="flora-skeleton h-3 w-40" />
        <div className="flora-skeleton h-10 w-2/3" />
        <div className="flora-skeleton h-4 w-48" />
      </div>
      <div className="flex gap-3">
        <div className="flora-skeleton h-12 flex-1 rounded-full" />
        <div className="flora-skeleton h-12 w-32 rounded-full" />
      </div>
      <CardGridSkeleton count={6} />
    </main>
  )
}
