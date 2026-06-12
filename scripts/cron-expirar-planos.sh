#!/usr/bin/env bash
#
# scripts/cron-expirar-planos.sh
# Expira planos vencidos — substitui o cron da Vercel (vercel.json) após a
# migração para o VPS. Lê o CRON_SECRET do .env e chama o endpoint protegido
# pela porta interna do app (localhost:3000). Idempotente: rodar 2x não causa dano.
#
# Instalar no VPS (uma vez):
#   crontab -e
#   # adicionar a linha (todo dia às 03:00):
#   0 3 * * * bash /var/www/achei/scripts/cron-expirar-planos.sh >> /var/log/achei-cron.log 2>&1
#
set -euo pipefail
cd "$(dirname "$0")/.."

SECRET=$(grep -E '^CRON_SECRET=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
if [ -z "${SECRET:-}" ]; then
  echo "[$(date -Iseconds)] ERRO: CRON_SECRET não encontrado no .env" >&2
  exit 1
fi

RESP=$(curl -fsS -H "Authorization: Bearer ${SECRET}" http://localhost:3000/api/cron/expirar-planos)
echo "[$(date -Iseconds)] expirar-planos OK: ${RESP}"
