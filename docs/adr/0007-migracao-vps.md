# ADR 0007 — Migração da hospedagem compartilhada para VPS

- **Status:** Aceito (executado em 2026-06-11)
- **Data:** 2026-06-11
- **Decisores:** Álvaro

## Contexto

O app rodava na hospedagem compartilhada da Hostinger (Node via gerenciador do hPanel) após
sair da Vercel (custo em dólar vetado). Em 11/06/2026 a produção entrou em crash loop (503)
recorrente: o query engine do Prisma (Rust) morria com `PANIC: timer has gone away` ao não
conseguir criar threads — limites invisíveis do shared (CloudLinux/LVE: memória/processos por
conta, não visíveis via `ulimit`). Mitigações de código (Prisma 5.22, `engineType=binary`,
redução de batimento de presença, boot resiliente) reduziram a exposição, mas não o teto.

## Decisão

**Migrar o aplicativo Node para um VPS Hostinger** (KVM, Ubuntu 24.04, em reais):

- Stack no VPS: **Node 22 + PM2** (processo vivo + autostart systemd) + **Caddy**
  (reverse proxy com HTTPS automático/Let's Encrypt). App em `/var/www/achei`.
- **O banco MySQL permanece no shared** (mudança mínima: um sistema migra por vez; e-mail e
  DNS também ficam). Conexão do VPS ao MySQL via rede.
- Deploy key read-only para o GitHub; `.env` de produção existe **apenas no servidor**.
- Deploy: esteira **GitHub Actions** (CI: `npm audit` + testes unitários → CD: SSH
  `git pull + npm ci + prisma migrate deploy + build + pm2 restart` → health check público).

## Alternativas consideradas

- **Voltar à Vercel:** resolveria o problema (serverless), mas custo em dólar foi vetado pelo
  decisor (já estourou o tier grátis no passado).
- **Permanecer no shared mitigando:** esgotado — o teto é estrutural, não do app.
- **Outros provedores (Railway/Render/Fly):** cobrança em dólar; VPS da própria Hostinger
  mantém moeda, painel e proximidade do banco.

## Consequências

- (+) Fim do crash loop: recursos dedicados, sem fork/limites do Passenger compartilhado.
- (+) Controle total (PM2, Caddy, cron, swap) e SSL wildcard possível — pré-requisito da
  fase multi-tenant da Rede (subdomínios por praça).
- (+) Custo em reais (~R$25-40/mês) e independência de painel proprietário.
- (−) Operação é nossa: atualizações de SO, segurança, monitoramento (mitigado por: UFW,
  UptimeRobot em `/api/health`, PM2 autostart, runbook `docs/infra/migracao-vps.md`).
- (−) Deploy deixou de ser automático do painel → resolvido com a esteira GitHub Actions.
- (−) Latência app↔banco entre servidores (aceitável; futura migração do MySQL para o VPS é
  possível e reversível, com backup dedicado planejado antes).
