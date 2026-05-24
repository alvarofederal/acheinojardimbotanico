import { CardGridSkeleton } from "../_components/skeletons"

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flora-skeleton h-12 max-w-xl mx-auto rounded-full" />
      <div className="flora-skeleton h-8 w-64" />
      <CardGridSkeleton count={6} />
    </main>
  )
}
