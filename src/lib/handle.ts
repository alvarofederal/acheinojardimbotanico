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

/**
 * Gera um handle ÚNICO e limpo a partir do nome do negócio.
 * Tenta o slug limpo (sem acento, sem sufixo aleatório); se já estiver em uso
 * ou for reservado, acrescenta -2, -3… `isTaken` deve cobrir handles E slugs
 * já existentes (pra não colidir com rota canônica de quem não tem handle).
 */
export function generateHandle(name: string, isTaken: (candidate: string) => boolean): string {
  const base =
    (name || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos (marcas combinantes)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "negocio"

  const free = (c: string) => !RESERVED_HANDLES.has(c) && !isTaken(c)
  if (free(base)) return base
  for (let i = 2; i < 1000; i++) {
    const c = `${base.slice(0, 36)}-${i}`
    if (free(c)) return c
  }
  return `${base.slice(0, 30)}-${Date.now().toString(36)}`
}
