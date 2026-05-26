/**
 * src/lib/handle.ts
 * Validação do "handle" (slug curto/vanity da loja, ex.: /arte-e-tradicao).
 * Precisa ser único, em formato slug e NÃO colidir com rotas existentes.
 */

// Palavras reservadas — primeiros segmentos de URL já usados pelo app.
export const RESERVED_HANDLES = new Set([
  "login", "register", "dashboard", "anuncie", "promocoes", "noticias", "eventos",
  "termos", "privacidade", "api", "sitemap.xml", "robots.txt", "reset-password",
  "forgot-password", "verify-email", "reivindicar", "busca", "loja", "admin",
  "conta", "negocio", "plano", "produtos", "metricas", "jardim-botanico",
  "opengraph-image", "favicon.ico", "_next",
])

const FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Retorna null se válido, ou uma mensagem de erro. */
export function validateHandle(raw: string): string | null {
  const h = raw.trim().toLowerCase()
  if (h.length < 3) return "Mínimo de 3 caracteres."
  if (h.length > 40) return "Máximo de 40 caracteres."
  if (!FORMAT.test(h)) return "Use apenas letras minúsculas, números e hífens (sem espaços ou acentos)."
  if (RESERVED_HANDLES.has(h)) return "Este nome é reservado. Escolha outro."
  return null
}

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase()
}
