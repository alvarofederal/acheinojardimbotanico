// In-memory rate limiting — suficiente para MVP de projeto solo
// Substituir por Upstash Redis se escalar para múltiplas instâncias
const store: Record<string, { count: number; resetAt: number }> = {}

export async function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()

  if (store[identifier] && store[identifier].resetAt < now) {
    delete store[identifier]
  }

  if (!store[identifier]) {
    store[identifier] = { count: 1, resetAt: now + windowMs }
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  store[identifier].count++
  return {
    allowed: store[identifier].count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - store[identifier].count),
  }
}

export async function resetRateLimit(identifier: string): Promise<void> {
  delete store[identifier]
}
