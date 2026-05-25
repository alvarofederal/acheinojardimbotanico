/**
 * src/lib/audit.ts
 * Registro e consulta do log de auditoria. Centraliza a gravação (sempre com
 * businessId quando a ação é sobre um lojista) e a leitura com busca por lojista.
 */
import { db, Prisma } from "@/lib/prisma"

export interface LogAuditInput {
  actorId?: string | null
  action: string
  entity: string
  entityId: string
  businessId?: string | null
  metadata?: Prisma.InputJsonValue
}

/** Grava uma entrada no AuditLog. */
export async function logAudit(input: LogAuditInput) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      businessId: input.businessId ?? null,
      metadata: input.metadata,
    },
  })
}

/** Rótulos amigáveis das ações registradas. */
export const ACTION_LABELS: Record<string, string> = {
  "business.import": "Importação de negócios",
  "claim.created": "Reivindicação criada",
  "claim.approved": "Reivindicação aprovada",
  "claim.rejected": "Reivindicação rejeitada",
  "claim.rejectd": "Reivindicação rejeitada", // typo legado mantido por compatibilidade
  "payment.confirmed": "Pagamento confirmado",
  "payment.rejected": "Pagamento rejeitado",
  "event.approve": "Evento aprovado",
  "event.reject": "Evento rejeitado",
  "PLAN_EXPIRED": "Plano expirado (auto)",
  "user.lgpd_delete": "Exclusão LGPD",
  "subscription.activated": "Assinatura ativada",
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export interface AuditRow {
  id: string
  action: string
  entity: string
  entityId: string
  businessId: string | null
  businessName: string | null
  metadata: unknown
  createdAt: Date
}

/**
 * Consulta paginada do log. `q` filtra pelo NOME do lojista.
 * `onlyBusiness` restringe a ações que têm um lojista associado.
 */
export async function queryAudit({
  q, page = 1, take = 10, onlyBusiness = false,
}: {
  q?: string; page?: number; take?: number; onlyBusiness?: boolean
}): Promise<{ rows: AuditRow[]; total: number; totalPages: number; page: number }> {
  const skip = (page - 1) * take

  const where: Prisma.AuditLogWhereInput = {}
  if (q && q.trim()) {
    const bizs = await db.business.findMany({
      where: { name: { contains: q.trim() } },
      select: { id: true },
      take: 500,
    })
    where.businessId = { in: bizs.length ? bizs.map(b => b.id) : ["__none__"] }
  } else if (onlyBusiness) {
    where.businessId = { not: null }
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    db.auditLog.count({ where }),
  ])

  // Enriquecimento com o nome do lojista
  const ids = [...new Set(logs.map(l => l.businessId).filter(Boolean) as string[])]
  const bizs = ids.length
    ? await db.business.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : []
  const bMap = new Map(bizs.map(b => [b.id, b.name]))

  const rows: AuditRow[] = logs.map(l => ({
    id: l.id, action: l.action, entity: l.entity, entityId: l.entityId,
    businessId: l.businessId, businessName: l.businessId ? (bMap.get(l.businessId) ?? null) : null,
    metadata: l.metadata, createdAt: l.createdAt,
  }))

  return { rows, total, totalPages: Math.max(1, Math.ceil(total / take)), page }
}
