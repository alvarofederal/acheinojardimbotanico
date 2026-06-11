export const runtime = "nodejs"
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { APP_VERSION } from "@/lib/version"

/**
 * Health check para monitoramento externo (UptimeRobot).
 * Testa app + banco de verdade (a home estática pode responder 200 do cache
 * com o banco morto). 200 = tudo ok · 503 = app de pé mas banco fora.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: true, version: APP_VERSION })
  } catch {
    return NextResponse.json({ ok: false, db: false, version: APP_VERSION }, { status: 503 })
  }
}
