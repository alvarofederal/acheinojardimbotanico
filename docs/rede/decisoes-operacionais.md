# Decisões Operacionais — Rede Achei × Achei JBT

> Definidas em 2026-06-08 (perguntas do Álvaro). Valem até decisão em contrário.

## D1 — Um repo só
A rede é construída **neste mesmo projeto/repo**. O JBT vira o tenant nº 1 (migração aditiva). Proibido repo paralelo / reescrita do zero. Renomear o repo (cosmético) pode acontecer depois, sem pressa.

## D2 — Quando construir o multi-tenant
- **Energia do Álvaro:** 100% em vendas do JBT (plano de ataque) até o Gate 1.
- **Claude prepara nos bastidores** em branch separada (schema Tenant, backfill JBT em dev, resolução por domínio) — pronto na prateleira, **sem merge na main**.
- **Merge em produção:** só após o **Gate 1 (10 pagantes)** — antecipável se, em ~30 dias, o funil der sinal forte (≥5 pagantes / conversão alta). Decisão com dado, nunca com ansiedade.
- Inviolável: produção do JBT não quebra. Migrations aditivas (3 leis), tenant default = jardim-botanico.

## D3 — Bugs do JBT durante a construção (prioridade)
| Nível | Definição | SLA | Tratativa |
|---|---|---|---|
| 🔴 P0 | Produção quebrada (site fora, login, pagamento) | Imediato | Para tudo → `fix/` → main → `npm run patch` → deploy → conferir rodapé |
| 🟡 P1 | Atrapalha a VENDA (claim no balcão, perfil do prospect) | ≤24h | Hotfix no dia seguinte |
| 🟢 P2 | Cosmético/menor | Lote semanal | Fila |

A `main` fica sempre limpa e deployável (rede em branch). Troca de contexto é do Claude (barata); o Álvaro só prioriza.
**Pendência crítica deste processo: UptimeRobot (detecção de P0). Configurar esta semana.**

## D4 — Aquisição de operadores (publicidade da rede)
1. **Build in public começa JÁ** (2-3 posts/semana: bastidores + números reais do JBT). Postar a jornada ≠ vender franquia — venda só após Gate 2.
2. **Lista de espera = pesquisa de mercado**: o formulário (cidade, porquê, horas, experiência) revela empiricamente quem é o operador real (anti-viés).
3. Canais por fase: orgânico/comunidades (Fase 1-2) → página "Leve o Achei pra sua cidade" no próprio guia → tráfego pago e imprensa SÓ com case real (Fase 3+).
