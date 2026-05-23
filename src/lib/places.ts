/**
 * src/lib/places.ts
 * Cliente para Google Places API (New)
 * Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

const BASE_URL = "https://places.googleapis.com/v1"
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// ─── Tipos da API ────────────────────────────────────────────────────────────

export interface PlaceResult {
  id: string
  displayName: { text: string; languageCode: string }
  formattedAddress: string
  location: { latitude: number; longitude: number }
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: {
    weekdayDescriptions: string[]
    periods: unknown[]
  }
  primaryType?: string
  rating?: number
  userRatingCount?: number
  editorialSummary?: { text: string; languageCode: string }
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>
}

export interface NearbySearchResponse {
  places: PlaceResult[]
  nextPageToken?: string
}

// ─── Mapeamento de tipos Google → categorias do Achei ───────────────────────

export const PLACE_TYPES_TO_IMPORT = [
  // Comida e bebida
  "restaurant", "cafe", "bakery", "bar", "meal_takeaway",
  "ice_cream_shop", "pizza_restaurant", "sushi_restaurant",
  "hamburger_restaurant", "brazilian_restaurant", "sandwich_shop",
  // Saúde e beleza
  "beauty_salon", "hair_care", "barber_shop", "nail_salon", "spa",
  "gym", "pharmacy", "dentist", "doctor", "physiotherapist",
  // Compras
  "supermarket", "convenience_store", "pet_store", "clothing_store",
  "shoe_store", "florist",
  // Serviços
  "car_repair", "car_wash", "laundry",
  // Educação
  "school",
] as const

export type PlaceType = (typeof PLACE_TYPES_TO_IMPORT)[number]

// Mapa de tipo Google → slug de categoria do Achei
export const CATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  restaurant:            { slug: "restaurantes",      name: "Restaurantes" },
  cafe:                  { slug: "cafes",              name: "Cafés" },
  bakery:                { slug: "padarias",           name: "Padarias" },
  bar:                   { slug: "bares",              name: "Bares" },
  meal_takeaway:         { slug: "delivery",           name: "Delivery" },
  ice_cream_shop:        { slug: "sorveterias",        name: "Sorveterias" },
  pizza_restaurant:      { slug: "pizzarias",          name: "Pizzarias" },
  sushi_restaurant:      { slug: "japonesa",           name: "Japonesa" },
  hamburger_restaurant:  { slug: "hamburguerias",      name: "Hamburguerias" },
  brazilian_restaurant:  { slug: "comida-brasileira",  name: "Comida Brasileira" },
  sandwich_shop:         { slug: "sanduiches",         name: "Sanduíches" },
  beauty_salon:          { slug: "saloes-de-beleza",   name: "Salões de Beleza" },
  hair_care:             { slug: "cabelereiros",       name: "Cabelereiros" },
  barber_shop:           { slug: "barbearias",         name: "Barbearias" },
  nail_salon:            { slug: "manicure",           name: "Manicure" },
  spa:                   { slug: "spa",                name: "Spa" },
  gym:                   { slug: "academias",          name: "Academias" },
  pharmacy:              { slug: "farmacias",          name: "Farmácias" },
  dentist:               { slug: "dentistas",          name: "Dentistas" },
  doctor:                { slug: "medicos",            name: "Médicos" },
  physiotherapist:       { slug: "fisioterapia",       name: "Fisioterapia" },
  supermarket:           { slug: "supermercados",      name: "Supermercados" },
  convenience_store:     { slug: "conveniencias",      name: "Conveniências" },
  pet_store:             { slug: "pet-shops",          name: "Pet Shops" },
  clothing_store:        { slug: "moda",               name: "Moda" },
  shoe_store:            { slug: "calcados",           name: "Calçados" },
  florist:               { slug: "floricultura",       name: "Floricultura" },
  car_repair:            { slug: "mecanicas",          name: "Mecânicas" },
  car_wash:              { slug: "lava-rapido",        name: "Lava Rápido" },
  laundry:               { slug: "lavanderias",        name: "Lavanderias" },
  school:                { slug: "escolas",            name: "Escolas" },
}

// ─── Funções da API ──────────────────────────────────────────────────────────

/**
 * Nearby Search (New) — busca lugares por tipo em raio ao redor de um ponto
 */
export async function searchNearby(params: {
  lat: number
  lng: number
  radiusMeters: number
  placeType: string
  maxResults?: number
}): Promise<PlaceResult[]> {
  const { lat, lng, radiusMeters, placeType, maxResults = 20 } = params

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
    "places.primaryType",
    "places.rating",
    "places.userRatingCount",
    "places.photos",
    "places.editorialSummary",
  ].join(",")

  const res = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      includedTypes: [placeType],
      maxResultCount: Math.min(maxResults, 20),
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Places API error (${res.status}): ${err}`)
  }

  const data: NearbySearchResponse = await res.json()
  return data.places ?? []
}

/**
 * Gera URL de foto do Google Places para exibição direta em <img src>.
 * O endpoint /media redireciona (302) para a imagem real do CDN do Google.
 * Limite de uso: só para exibição — não armazenar permanentemente (TOS).
 */
export function getPhotoUrl(photoName: string, maxWidth = 800): string {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`
}

/**
 * Extrai o bairro/cidade a partir do endereço formatado do Google
 * Ex: "CLN 408 Bl D, Asa Norte, Brasília - DF, 70856-540, Brazil" → "Asa Norte"
 */
export function extractNeighborhood(formattedAddress: string): string {
  // Remove país e CEP, pega o segundo segmento
  const parts = formattedAddress.split(",").map((p) => p.trim())
  // Geralmente: [logradouro, bairro, cidade - UF, CEP, país]
  if (parts.length >= 2) {
    const candidate = parts[1]
    // Ignora se parecer CEP ou cidade
    if (!/\d{5}/.test(candidate) && !candidate.includes(" - ")) {
      return candidate
    }
  }
  return "Jardim Botânico"
}

/**
 * Gera slug URL-friendly a partir do nome + placeId (garante unicidade)
 */
export function generateSlug(name: string, placeId: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50)

  // Sufixo curto do placeId para garantir unicidade
  const suffix = placeId.slice(-6).toLowerCase()
  return `${base}-${suffix}`
}
