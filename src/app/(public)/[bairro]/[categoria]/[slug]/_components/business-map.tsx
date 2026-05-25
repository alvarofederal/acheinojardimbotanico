import { MapPin, Navigation } from "lucide-react"

/**
 * Mapa interativo (arrasta/zoom) do local do negócio.
 * Usa OpenStreetMap embutido — sem chave de API e sem custo.
 */
export function BusinessMap({
  lat, lng, name, address, mapsUrl,
}: {
  lat: number; lng: number; name: string; address: string; mapsUrl: string
}) {
  const d = 0.0045 // ~500m de janela ao redor do ponto
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`

  return (
    <div className="mt-5 flora-card rounded-3xl overflow-hidden">
      <iframe
        title={`Mapa de ${name}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-64 sm:h-80 border-0 block"
      />
      <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm flora-muted flex items-center gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-flora-green flex-shrink-0" />
          <span className="truncate">{address}</span>
        </p>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full flora-chip text-sm font-semibold flora-ink transition-all flex-shrink-0">
          <Navigation className="w-4 h-4 text-flora-green" /> Como chegar
        </a>
      </div>
    </div>
  )
}
