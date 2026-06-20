/**
 * src/lib/opening-hours.ts
 * Fonte ÚNICA da lógica de horário de funcionamento + status "aberto agora".
 * Formato compatível com o Google (periods), guardado no campo JSON
 * `Business.openingHours`. Sem dependência de banco — pode ser usado em
 * client components (card, filtro, perfil) e no editor do dashboard.
 */

export interface OpeningPeriod {
  open: { day: number; hour: number; minute: number }
  /** Pode faltar: o Google omite `close` em negócios abertos 24h. */
  close?: { day: number; hour: number; minute: number }
}

export interface OpeningHours {
  periods?: OpeningPeriod[]
  /** Lojista marcou que fecha em feriados. Se ausente, feriado só informa "Feriado". */
  feriadoFechado?: boolean
}

export type OpenState = "aberto" | "fechado" | "feriado" | "desconhecido"

export interface OpenStatus {
  state: OpenState
  /** Texto da tag: "Aberto" | "Fechado" | "Feriado" | "Horário não informado" */
  label: string
  /** Complemento opcional (nome do feriado, "Fecha às 20:00", etc.) */
  detail?: string
}

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
const pad = (n: number) => String(n).padStart(2, "0")
const fmt = (h: number, m: number) => `${pad(h)}:${pad(m)}`

// ─────────────────────────────  FERIADOS (BR + DF)  ─────────────────────────────
/** Domingo de Páscoa (algoritmo de Meeus/Butcher, calendário gregoriano). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const mth = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * mth + 114) / 31)
  const day = ((h + l - 7 * mth + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const mmdd = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Feriados de um ano (chave "MM-DD" → nome). Nacionais + regionais do DF/Brasília. */
export function holidaysBR(year: number): Map<string, string> {
  const map = new Map<string, string>()
  // Nacionais fixos
  map.set("01-01", "Confraternização Universal")
  map.set("04-21", "Tiradentes")
  map.set("05-01", "Dia do Trabalho")
  map.set("09-07", "Independência do Brasil")
  map.set("10-12", "Nossa Senhora Aparecida")
  map.set("11-02", "Finados")
  map.set("11-15", "Proclamação da República")
  map.set("11-20", "Dia da Consciência Negra")
  map.set("12-25", "Natal")
  // Regionais — DF / Brasília
  map.set("04-21", "Fundação de Brasília") // mesma data de Tiradentes; rótulo local
  map.set("11-30", "Dia do Evangélico (DF)")
  // Móveis (derivados da Páscoa)
  const easter = easterSunday(year)
  const carnaval = new Date(easter); carnaval.setDate(easter.getDate() - 47) // terça de carnaval
  const sextaSanta = new Date(easter); sextaSanta.setDate(easter.getDate() - 2)
  const corpus = new Date(easter); corpus.setDate(easter.getDate() + 60)
  map.set(mmdd(carnaval), "Carnaval")
  map.set(mmdd(sextaSanta), "Sexta-feira Santa")
  map.set(mmdd(corpus), "Corpus Christi")
  return map
}

/**
 * Componentes de data/hora SEMPRE no fuso de Brasília (America/Sao_Paulo),
 * independente de onde o código roda — servidor em UTC (VPS) ou browser de um
 * visitante em qualquer fuso. É isto que mantém "aberto agora" idêntico entre
 * o card (client) e o perfil (server). Sem isto, o VPS calcula em UTC (3h a mais).
 */
function brasiliaParts(now: Date): { day: number; minutes: number; mmdd: string; year: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(now).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a }, {})
  const wd: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    day: wd[p.weekday] ?? now.getDay(),
    minutes: (Number(p.hour) % 24) * 60 + Number(p.minute),
    mmdd: `${p.month}-${p.day}`,
    year: Number(p.year),
  }
}

/** Nome do feriado de hoje (ou null) — no fuso de Brasília. */
export function holidayToday(now: Date = new Date()): string | null {
  const { mmdd: md, year } = brasiliaParts(now)
  return holidaysBR(year).get(md) ?? null
}

// ─────────────────────────────  STATUS  ─────────────────────────────
export function parseOpeningHours(raw: unknown): OpeningHours | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as OpeningHours
  return Array.isArray(o.periods) || typeof o.feriadoFechado === "boolean" ? o : null
}

/**
 * Status do negócio AGORA. Regras:
 * - Feriado → "Feriado" (informativo). Se o lojista marcou feriadoFechado → "Fechado".
 * - Sem nenhum horário cadastrado → "Horário não informado".
 * - Caso normal → "Aberto" / "Fechado" pelo dia da semana + hora.
 */
export function getOpenStatus(raw: unknown, now: Date = new Date()): OpenStatus {
  const h = parseOpeningHours(raw)
  const hasData = !!h?.periods && h.periods.length > 0
  const { day, minutes: mins, mmdd: md, year } = brasiliaParts(now)
  const holiday = holidaysBR(year).get(md) ?? null

  if (holiday) {
    if (h?.feriadoFechado) return { state: "fechado", label: "Fechado", detail: holiday }
    return { state: "feriado", label: "Feriado", detail: holiday }
  }

  if (!hasData) return { state: "desconhecido", label: "Horário não informado" }

  for (const p of h!.periods!) {
    if (!p?.open) continue // período malformado, ignora
    // sem horário de fechamento = aberto 24h (padrão do Google pra 24/7)
    if (!p.close) return { state: "aberto", label: "Aberto", detail: "Aberto 24 horas" }
    // período que abre hoje (fecha hoje ou vira a madrugada)
    if (p.open.day === day) {
      const o = p.open.hour * 60 + p.open.minute
      let c = p.close.hour * 60 + p.close.minute
      if (p.close.day !== p.open.day) c += 24 * 60 // vira a madrugada
      if (mins >= o && mins < c) return { state: "aberto", label: "Aberto", detail: `Fecha às ${fmt(p.close.hour, p.close.minute)}` }
    }
    // período da véspera que entra na madrugada de hoje (ex.: sex 22:00 → sáb 02:00)
    if (p.close.day === day && p.close.day !== p.open.day) {
      const c = p.close.hour * 60 + p.close.minute
      if (mins < c) return { state: "aberto", label: "Aberto", detail: `Fecha às ${fmt(p.close.hour, p.close.minute)}` }
    }
  }
  return { state: "fechado", label: "Fechado" }
}

// ─────────────────────────────  EDITOR / EXIBIÇÃO  ─────────────────────────────
export interface DayRange { open: string; close: string } // "HH:MM"
export interface DayHours { closed: boolean; ranges: DayRange[] }

const toHM = (mins: number): string => fmt(Math.floor(mins / 60), mins % 60)
const fromHM = (s: string) => { const [h, m] = s.split(":").map(Number); return { hour: h || 0, minute: m || 0 } }

/** JSON do banco → modelo de 7 dias para o editor (índice 0 = domingo). */
export function toEditorModel(raw: unknown): DayHours[] {
  const h = parseOpeningHours(raw)
  const days: DayHours[] = Array.from({ length: 7 }, () => ({ closed: true, ranges: [] }))
  for (const p of h?.periods ?? []) {
    if (!p?.open) continue
    const d = days[p.open.day]
    if (!d) continue
    d.closed = false
    // sem "close" = aberto 24h: mostra o dia aberto o dia todo
    if (!p.close) { d.ranges.push({ open: "00:00", close: "23:59" }); continue }
    d.ranges.push({ open: fmt(p.open.hour, p.open.minute), close: fmt(p.close.hour, p.close.minute) })
  }
  return days
}

/** Modelo do editor → JSON (periods) pro banco. Dias fechados não geram period. */
export function fromEditorModel(days: DayHours[], feriadoFechado: boolean): OpeningHours {
  const periods: OpeningPeriod[] = []
  days.forEach((d, day) => {
    if (d.closed) return
    for (const r of d.ranges) {
      if (!r.open || !r.close) continue
      const o = fromHM(r.open)
      const c = fromHM(r.close)
      // fecha depois da meia-noite → close cai no dia seguinte
      const closeDay = (c.hour * 60 + c.minute) <= (o.hour * 60 + o.minute) ? (day + 1) % 7 : day
      periods.push({ open: { day, ...o }, close: { day: closeDay, ...c } })
    }
  })
  return { periods, feriadoFechado }
}

/** Linhas pro quadro da semana no perfil (padrão Google). */
export function weekRows(raw: unknown, now: Date = new Date()): { day: string; text: string; today: boolean }[] {
  const model = toEditorModel(raw)
  const todayIdx = brasiliaParts(now).day
  // exibe começando na segunda (1) até domingo (0), como o Google
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map(i => {
    const d = model[i]
    const text = d.closed || d.ranges.length === 0
      ? "Fechado"
      : d.ranges.map(r => `${r.open}–${r.close}`).join(", ")
    return { day: WEEKDAYS[i], text, today: i === todayIdx }
  })
}
