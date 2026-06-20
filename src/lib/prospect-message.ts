/**
 * src/lib/prospect-message.ts
 * Monta a mensagem de prospecção adequada ao tipo de negócio, no formato
 * "entrega do presente" (display com QR) — o objetivo é marcar a visita.
 */

/** Gancho de 1 linha adequado ao ramo. Usa palavras-chave do slug + nome. */
export function categoryHook(categorySlug: string, categoryName: string): string {
  const s = `${categorySlug} ${categoryName}`.toLowerCase()
  const has = (...words: string[]) => words.some((w) => s.includes(w))

  // Comida e bebida
  if (has("bar", "caf", "restaur", "padaria", "lanch", "pizz", "hamb", "sushi", "açaí", "acai", "sorvet", "doceria", "confeit", "gastr", "churrasc", "comida", "bistr", "pub", "cervej", "espetinho"))
    return "Quando o pessoal do bairro procura onde comer ou beber por aqui, acha vocês e já chama no WhatsApp."

  // Beleza
  if (has("salão", "salao", "barbear", "estétic", "estetic", "cabelei", "manicure", "unha", "spa", "sobrancelha", "depila", "beleza", "maquiagem"))
    return "Quem procura esse serviço pertinho acha vocês e já marca pelo WhatsApp."

  // Auto
  if (has("mecân", "mecan", "oficina", "autopeç", "automotiv", "bateria", "óleo", "oleo", "pneu", "funilaria", "lava-jato", "lava jato", "martelinho"))
    return "Carro é urgência — quem fica na mão procura às pressas e precisa achar vocês ali, rápido."

  // Saúde
  if (has("farmác", "farmac", "drogaria", "clínic", "clinic", "dentist", "odonto", "fisio", "médic", "medic", "laborat", "psicolog", "nutri", "veterinár", "veterinar"))
    return "Quem precisa na correria acha vocês perto e na hora."

  // Serviços para casa
  if (has("eletricist", "encanad", "faz tudo", "faz-tudo", "limpeza", "lavander", "chaveir", "reforma", "pintor", "pedreir", "marcen", "vidrac", "dedetiz", "conserto", "assistênc", "assistenc", "manutenç", "manutenc", "serralher", "refrigera", "ar condicionado"))
    return "Quando dá aquele perrengue em casa, a pessoa procura com urgência — e acha vocês."

  // Delivery / bebidas / itens de consumo
  if (has("delivery", "polpa", "suco", "marmit", "distribuid", "água", "agua", "gás ", "gas "))
    return "Dá pra montar a vitrine dos seus itens e receber pedido direto no WhatsApp."

  // Fitness
  if (has("academ", "cross", "pilates", "yoga", "treino", "fit", "luta", "muay", "jiu", "dança", "danca", "natação", "natacao", "funcional"))
    return "Quem procura treino no bairro acha vocês e já chama pra conhecer."

  // Profissionais
  if (has("imobil", "corret", "advoc", "advog", "contab", "escola", "colég", "coleg", "curso", "creche", "educa", "faculdade", "idiomas", "arquitet", "engenh", "consultor", "cartóri", "cartori"))
    return "Quem busca esse serviço na região acha vocês primeiro."

  // Lojas / varejo
  if (has("moda", "roupa", "calçad", "calcad", "decora", "celular", "loja", "presente", "pet", "ótica", "otica", "joalh", "papelaria", "floric", "móvel", "movel", "store", "brechó", "brecho", "perfum", "cosmétic", "cosmetic", "bijou", "tabacaria", "mercad", "supermerc", "empório", "emporio"))
    return "Dá pra montar uma vitrine com fotos dos produtos e vender direto pelo WhatsApp."

  // Genérico
  return "Quando alguém do bairro procura por isso, acha vocês e já fala no WhatsApp."
}

export interface ProspectMessageInput {
  name: string
  link: string
  rating: number | null
  ratingCount: number | null
  categorySlug: string
  categoryName: string
}

/** Follow-up D+3 — prova visual + lembra o presente (display). */
export function buildFollowup3Message(i: { name: string; link: string }): string {
  return `Oi, pessoal da ${i.name}! Álvaro aqui de novo 🌿

Passando rapidinho pra mostrar como o perfil de vocês ficou no ar: ${i.link}

E aquele *display com QR* pro balcão continua de pé — é presente, sem custo nenhum. Posso passar aí essa semana pra entregar em mãos?`
}

/** Follow-up D+7 — última mensagem, escassez honesta (1 destaque por categoria). */
export function buildFollowup7Message(i: { name: string; categoryName: string }): string {
  return `Pessoal da ${i.name}, última mensagem pra não encher! 🙂

Semana que vem vou liberar o *destaque de ${i.categoryName}* da região pra outro negócio — antes quis confirmar com vocês, que são uma das referências da categoria por aqui.

Se não fizer sentido agora, tranquilo — o perfil de vocês continua no guia normalmente. 🌿`
}

/**
 * Abordagem pro perfil ABANDONADO/incompleto (Radar Fantasma).
 * Tom de ajuda, nunca alarme. Não promete "ranquear no Google" — promete
 * deixar o perfil completo e achável, e já emendar no guia do bairro.
 */
export function buildGhostMessage(i: { name: string; link: string; missing?: string[] }): string {
  const faltas = (i.missing ?? [])
    .map((m) => m.toLowerCase().replace(/^sem\s+/, "").replace(/^poucas?\s+/, "poucas "))
    .slice(0, 3)
    .join(", ")
  const trecho = faltas ? ` (tá faltando ${faltas})` : ""

  return `Olá, pessoal da ${i.name}! Tudo bem? Aqui é o Álvaro, morador do Jardim Botânico 🌿

Montei o *Achei no Jardim Botânico*, um guia só dos negócios daqui, e já coloquei vocês lá: ${i.link}

Reparei que o perfil de vocês no Google tá meio incompleto${trecho} — e isso faz o cliente desistir antes de chamar. Eu deixo ele redondo pra vocês (foto, horário, contato, descrição) e já garanto vocês no guia do bairro.

Posso passar aí essa semana pra mostrar, sem compromisso? 🌿`
}

/** Mensagem completa, focada em entregar o display (presente) em mãos. */
export function buildProspectMessage(i: ProspectMessageInput): string {
  const hook = categoryHook(i.categorySlug, i.categoryName)
  const ref =
    i.rating && i.rating >= 4.5
      ? ` Vocês são referência aqui (nota ${i.rating.toFixed(1).replace(".0", "")}${i.ratingCount ? `, ${i.ratingCount} avaliações` : ""}! 👏)`
      : ""

  return `Olá, pessoal da ${i.name}! Tudo bem? Aqui é o Álvaro, morador aqui do bairro 🌿

Montei o *Achei no Jardim Botânico*, um guia só dos negócios daqui, e já deixei vocês lá — olha como ficou: ${i.link}

${hook}${ref}

Fiz um *presente* pra vocês: um display com o QR da loja pra deixar no balcão. Quero passar aí pra entregar em mãos — sem custo, sem compromisso. Posso aparecer essa semana? 🌿`
}
