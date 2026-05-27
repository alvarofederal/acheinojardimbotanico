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
  reviews?: Array<{
    rating?: number
    text?: { text: string }
    relativePublishTimeDescription?: string
    authorAttribution?: { displayName?: string; photoUri?: string }
  }>
}

export interface NearbySearchResponse {
  places: PlaceResult[]
  nextPageToken?: string
}

// ─── Mapeamento de tipos Google → categorias do Achei ───────────────────────

export const PLACE_TYPES_TO_IMPORT = [
  // Comida e bebida
  "restaurant", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery",
  "ice_cream_shop", "pizza_restaurant", "sushi_restaurant",
  "hamburger_restaurant", "brazilian_restaurant", "sandwich_shop",
  "steak_house", "seafood_restaurant", "italian_restaurant", "mexican_restaurant",
  "vegetarian_restaurant", "fast_food_restaurant", "dessert_shop", "candy_store",
  "chocolate_shop", "confectionery", "juice_shop", "buffet_restaurant",
  "fine_dining_restaurant", "diner", "pub", "wine_bar", "food_court",
  // Saúde e beleza
  "beauty_salon", "hair_care", "barber_shop", "nail_salon", "spa",
  "gym", "pharmacy", "dentist", "doctor", "physiotherapist",
  "medical_center", "veterinary_care", "hospital", "drugstore",
  "dental_clinic", "wellness_center", "skin_care_clinic", "massage",
  "yoga_studio", "fitness_center",
  // Compras
  "supermarket", "convenience_store", "pet_store", "clothing_store",
  "shoe_store", "florist", "book_store", "jewelry_store",
  "electronics_store", "hardware_store", "home_goods_store", "furniture_store",
  "liquor_store", "grocery_store", "market", "gift_shop", "sporting_goods_store",
  "bicycle_store", "home_improvement_store", "cell_phone_store", "shopping_mall",
  "butcher_shop", "cosmetics_store", "beauty_supply_store", "department_store",
  "toy_store", "baby_store",
  // Serviços
  "car_repair", "car_wash", "laundry", "real_estate_agency",
  "lawyer", "accounting", "bank", "electrician", "plumber", "locksmith",
  "travel_agency", "insurance_agency", "courier_service", "moving_company",
  "storage", "tailor", "funeral_home", "child_care_agency", "gas_station",
  // Educação e cultura
  "school", "preschool", "primary_school", "secondary_school", "university",
  "library", "driving_school",
  // Lazer e outros
  "lodging", "hotel", "night_club", "photographer", "art_gallery", "event_venue",
] as const

export type PlaceType = (typeof PLACE_TYPES_TO_IMPORT)[number]

// Mapa de tipo Google → slug de categoria do Achei
export const CATEGORY_MAP: Record<string, { slug: string; name: string }> = {
  restaurant:            { slug: "restaurantes",      name: "Restaurantes" },
  cafe:                  { slug: "cafes",              name: "Cafés" },
  bakery:                { slug: "padarias",           name: "Padarias" },
  bar:                   { slug: "bares",              name: "Bares" },
  meal_takeaway:         { slug: "delivery",           name: "Delivery" },
  meal_delivery:         { slug: "delivery",           name: "Delivery" },
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
  medical_center:        { slug: "clinicas",           name: "Clínicas" },
  veterinary_care:       { slug: "veterinarias",       name: "Veterinárias" },
  supermarket:           { slug: "supermercados",      name: "Supermercados" },
  convenience_store:     { slug: "conveniencias",      name: "Conveniências" },
  pet_store:             { slug: "pet-shops",          name: "Pet Shops" },
  clothing_store:        { slug: "moda",               name: "Moda" },
  shoe_store:            { slug: "calcados",           name: "Calçados" },
  florist:               { slug: "floricultura",       name: "Floricultura" },
  book_store:            { slug: "livrarias",          name: "Livrarias" },
  jewelry_store:         { slug: "joalherias",         name: "Joalherias" },
  electronics_store:     { slug: "eletronicos",        name: "Eletrônicos" },
  hardware_store:        { slug: "materiais-construcao", name: "Materiais de Construção" },
  home_goods_store:      { slug: "casa-decoracao",     name: "Casa e Decoração" },
  furniture_store:       { slug: "moveis",             name: "Móveis" },
  liquor_store:          { slug: "adegas",             name: "Adegas e Bebidas" },
  car_repair:            { slug: "mecanicas",          name: "Mecânicas" },
  car_wash:              { slug: "lava-rapido",        name: "Lava Rápido" },
  laundry:               { slug: "lavanderias",        name: "Lavanderias" },
  real_estate_agency:    { slug: "imobiliarias",       name: "Imobiliárias" },
  lawyer:                { slug: "advocacia",          name: "Advocacia" },
  accounting:            { slug: "contabilidade",      name: "Contabilidade" },
  bank:                  { slug: "bancos",             name: "Bancos" },
  school:                { slug: "escolas",            name: "Escolas" },
  // ── Comida e bebida (novos) ──
  steak_house:           { slug: "churrascarias",      name: "Churrascarias" },
  seafood_restaurant:    { slug: "frutos-do-mar",      name: "Frutos do Mar" },
  italian_restaurant:    { slug: "italiana",           name: "Italiana" },
  mexican_restaurant:    { slug: "mexicana",           name: "Mexicana" },
  vegetarian_restaurant: { slug: "vegetariana",        name: "Vegetariana" },
  fast_food_restaurant:  { slug: "fast-food",          name: "Fast Food" },
  dessert_shop:          { slug: "doces",              name: "Doces e Sobremesas" },
  candy_store:           { slug: "doces",              name: "Doces e Sobremesas" },
  chocolate_shop:        { slug: "doces",              name: "Doces e Sobremesas" },
  confectionery:         { slug: "doces",              name: "Doces e Sobremesas" },
  juice_shop:            { slug: "sucos",              name: "Sucos e Açaí" },
  buffet_restaurant:     { slug: "buffets",            name: "Buffets" },
  fine_dining_restaurant:{ slug: "restaurantes",       name: "Restaurantes" },
  diner:                 { slug: "restaurantes",       name: "Restaurantes" },
  pub:                   { slug: "bares",              name: "Bares" },
  wine_bar:              { slug: "bares",              name: "Bares" },
  food_court:            { slug: "praca-alimentacao",  name: "Praça de Alimentação" },
  // ── Saúde e beleza (novos) ──
  hospital:              { slug: "hospitais",          name: "Hospitais" },
  drugstore:             { slug: "farmacias",          name: "Farmácias" },
  dental_clinic:         { slug: "dentistas",          name: "Dentistas" },
  wellness_center:       { slug: "bem-estar",          name: "Bem-estar" },
  skin_care_clinic:      { slug: "estetica",           name: "Estética" },
  massage:               { slug: "estetica",           name: "Estética" },
  yoga_studio:           { slug: "academias",          name: "Academias" },
  fitness_center:        { slug: "academias",          name: "Academias" },
  // ── Compras (novos) ──
  grocery_store:         { slug: "mercearias",         name: "Mercearias" },
  market:                { slug: "supermercados",      name: "Supermercados" },
  gift_shop:             { slug: "presentes",          name: "Presentes" },
  sporting_goods_store:  { slug: "esportes",           name: "Esportes" },
  bicycle_store:         { slug: "esportes",           name: "Esportes" },
  home_improvement_store:{ slug: "materiais-construcao", name: "Materiais de Construção" },
  cell_phone_store:      { slug: "celulares",          name: "Celulares e Telefonia" },
  shopping_mall:         { slug: "shoppings",          name: "Shoppings" },
  butcher_shop:          { slug: "acougues",           name: "Açougues" },
  cosmetics_store:       { slug: "cosmeticos",         name: "Cosméticos e Perfumaria" },
  beauty_supply_store:   { slug: "cosmeticos",         name: "Cosméticos e Perfumaria" },
  department_store:      { slug: "lojas-departamento", name: "Lojas de Departamento" },
  toy_store:             { slug: "brinquedos",         name: "Brinquedos" },
  baby_store:            { slug: "bebes",              name: "Bebês e Crianças" },
  // ── Serviços (novos) ──
  electrician:           { slug: "eletricistas",       name: "Eletricistas" },
  plumber:               { slug: "encanadores",        name: "Encanadores" },
  locksmith:             { slug: "chaveiros",          name: "Chaveiros" },
  travel_agency:         { slug: "agencias-viagem",    name: "Agências de Viagem" },
  insurance_agency:      { slug: "seguros",            name: "Seguros" },
  courier_service:       { slug: "entregas",           name: "Entregas e Logística" },
  moving_company:        { slug: "mudancas",           name: "Mudanças" },
  storage:               { slug: "guarda-moveis",      name: "Guarda-móveis" },
  tailor:                { slug: "costura",            name: "Costura e Alfaiataria" },
  funeral_home:          { slug: "funerarias",         name: "Funerárias" },
  child_care_agency:     { slug: "creches",            name: "Creches" },
  gas_station:           { slug: "postos",             name: "Postos de Combustível" },
  // ── Educação e cultura (novos) ──
  preschool:             { slug: "creches",            name: "Creches" },
  primary_school:        { slug: "escolas",            name: "Escolas" },
  secondary_school:      { slug: "escolas",            name: "Escolas" },
  university:            { slug: "faculdades",         name: "Faculdades" },
  library:               { slug: "bibliotecas",        name: "Bibliotecas" },
  driving_school:        { slug: "autoescolas",        name: "Autoescolas" },
  // ── Lazer e outros (novos) ──
  lodging:               { slug: "hospedagem",         name: "Hospedagem" },
  hotel:                 { slug: "hospedagem",         name: "Hospedagem" },
  night_club:            { slug: "baladas",            name: "Baladas e Casas Noturnas" },
  photographer:          { slug: "fotografia",         name: "Fotografia" },
  art_gallery:           { slug: "galerias",           name: "Galerias de Arte" },
  event_venue:           { slug: "eventos",            name: "Espaços de Eventos" },
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
    "places.reviews",
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
      languageCode: "pt-BR",
      regionCode: "BR",
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
 * Text Search (New) — busca lugares por texto livre, com viés de localização.
 * Ideal para negócios menores/sem tipo (ex: ateliês em casa, MEIs) que não
 * aparecem na Nearby Search por tipo, mas existem no Google Meu Negócio.
 */
export async function searchText(params: {
  textQuery: string
  lat: number
  lng: number
  radiusMeters: number
  maxResults?: number
}): Promise<PlaceResult[]> {
  const { textQuery, lat, lng, radiusMeters, maxResults = 20 } = params

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
    "places.primaryType",
    "places.rating",
    "places.userRatingCount",
    "places.photos",
    "places.editorialSummary",
    "places.reviews",
  ].join(",")

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: Math.min(maxResults, 20),
      languageCode: "pt-BR",
      regionCode: "BR",
      locationBias: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Places Text Search error (${res.status}): ${err}`)
  }

  const data: NearbySearchResponse = await res.json()
  return data.places ?? []
}

/**
 * Caminho do PROXY interno de foto (armazenado no banco, sem expor a chave).
 * Ex: getPhotoProxyPath("places/X/photos/Y") → "/api/photo/places/X/photos/Y"
 * O navegador chama esse caminho; o proxy busca no Google e redireciona p/ o CDN.
 */
export function getPhotoProxyPath(photoName: string): string {
  return `/api/photo/${photoName}`
}

/**
 * URL real do Google Places Photo (uso SERVER-SIDE apenas, dentro do proxy).
 * Com skipRedirect=true retorna JSON { photoUri } em vez de redirecionar.
 */
export function getGooglePhotoUrl(photoName: string, maxWidth = 1600, skipRedirect = false): string {
  const skip = skipRedirect ? "&skipHttpRedirect=true" : ""
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}${skip}`
}

/**
 * Resolve a URL real (CDN) de uma foto do Google — SERVER-SIDE.
 * ⚠️ Esta é a chamada COBRÁVEL (Place Photo). Use com parcimônia (cache/migração).
 */
export async function resolveGooglePhotoUri(photoName: string, maxWidth = 1600): Promise<string | null> {
  try {
    const res = await fetch(getGooglePhotoUrl(photoName, maxWidth, true), { next: { revalidate: 60 * 60 * 24 } })
    if (!res.ok) return null
    const data = (await res.json()) as { photoUri?: string }
    return data.photoUri ?? null
  } catch {
    return null
  }
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
