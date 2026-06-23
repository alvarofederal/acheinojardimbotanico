import { db } from "@/lib/prisma"
import { generateHandle } from "@/lib/handle"

/**
 * Gera um handle ÚNICO consultando o banco (handle E slug, que dividem rota).
 * Use ao CRIAR negócio (import, cadastro) pra todo negócio já nascer com URL curta.
 * Sequencial: dentro de um loop de import, cada create já comitado é visto no próximo.
 */
export async function generateUniqueHandle(name: string): Promise<string> {
  const tried = new Set<string>()
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = generateHandle(name, c => tried.has(c))
    const clash = await db.business.findFirst({
      where: { OR: [{ handle: candidate }, { slug: candidate }] },
      select: { id: true },
    })
    if (!clash) return candidate
    tried.add(candidate)
  }
  // Último recurso: variante com sufixo de tempo (generateHandle trata quando tudo "ocupado")
  return generateHandle(name, () => true)
}
