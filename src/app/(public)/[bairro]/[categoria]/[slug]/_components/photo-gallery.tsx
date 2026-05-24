"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  const show = (i: number) => { setIdx(i); setOpen(true) }
  const close = useCallback(() => setOpen(false), [])
  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, close, prev, next])

  if (photos.length === 0) return null
  const grid = photos.slice(0, 3)
  const extra = photos.length - grid.length

  return (
    <>
      <div className="mb-8 grid grid-cols-4 grid-rows-2 gap-2.5 rounded-3xl overflow-hidden flora-rise" style={{ height: "min(70vw, 460px)" }}>
        {grid.map((url, i) => (
          <button
            key={i}
            onClick={() => show(i)}
            className={`relative overflow-hidden bg-flora-sand dark:bg-white/5 group ${i === 0 ? "col-span-4 sm:col-span-2 row-span-2" : "col-span-2 sm:col-span-2"}`}
          >
            <img src={url} alt={`${name} — foto ${i + 1}`} loading={i === 0 ? "eager" : "lazy"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {i === 2 && extra > 0 && (
              <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-serif text-2xl">
                +{extra}
              </span>
            )}
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={close}>
          <button onClick={close} aria-label="Fechar" className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Anterior"
                className="absolute left-3 sm:left-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }} aria-label="Próxima"
                className="absolute right-3 sm:right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img src={photos[idx]} alt={`${name} — foto ${idx + 1}`} onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg" />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
            {idx + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  )
}
