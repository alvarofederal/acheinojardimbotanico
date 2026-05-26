# Spec — Cortesia / Trial (ativação sem receita)

> Status: **proposta** (aguardando OK do Álvaro). Não implementar até aprovação.
> Princípio: cortesia dá o **mesmo acesso** de um plano pago, mas **R$0** e **fora da receita**.

---

## Problema
Hoje só existe um caminho de ativação: confirmar um `PaymentClaim`. Se eu liberar
um mês grátis para um lojista usando esse caminho, acontecem **dois furos contábeis**:

1. **Total/Mês recebido** = soma dos `PaymentClaim` CONFIRMADOS. Uma cortesia com
   valor entraria como dinheiro que **não recebi**.
2. **MRR** = soma do preço de **todo** negócio com plano pago ativo. Um negócio em
   cortesia **infla o MRR** mesmo sem pagar — independente de como foi ativado.

Resultado: o painel mente pra mim. Decisão de dono baseada em número falso = ruim.

## Objetivo
- O lojista em cortesia usa o plano normalmente (todos os recursos liberados).
- Do meu lado, a cortesia **não conta como receita** (nem em Total/Mês, nem no MRR).
- Eu vejo claramente **quantas cortesias ativas** existem (pipeline, não receita).
- Quando a cortesia vira pagamento de verdade, vira receita normal.
- **Nada do que funciona hoje quebra** (pagamento manual, expiração via cron, gates de plano).

---

## Modelo de dados (mudanças aditivas)
1. **`Business.planIsCourtesy Boolean @default(false)`** — marca se o plano ativo atual
   é cortesia. `false` = pagante de verdade (ou Free). Aditivo, não destrutivo.
2. **`PaymentClaim.method`** passa a aceitar o valor **`"COURTESY"`** (já é string).
   A cortesia é registrada como um `PaymentClaim` com `method: "COURTESY"`,
   `amountCents: 0`, `status: "CONFIRMED"` — fica no histórico, marcado como cortesia.

> Por que registrar como PaymentClaim? Pra ter **um histórico único** de ativações
> ("concedi cortesia ao X em tal data, N meses"), com R$0, sem inventar tabela nova.

## Fluxo — "Liberar cortesia" (admin)
Novo botão/ação no admin (ver decisão em aberto sobre onde):
1. Escolhe negócio + plano (Visibilidade/Premium) + meses.
2. Sistema:
   - `business.plan = <plano>`, `planExpiresAt = (vigente ou agora) + meses` (estende se já ativo),
     **`planIsCourtesy = true`**.
   - `Subscription` upsert ACTIVE.
   - cria `PaymentClaim { method:"COURTESY", amountCents:0, status:"CONFIRMED", months, plan, reviewedAt:now }`.
   - `AuditLog` `plan.courtesy_granted` (com businessId).
   - e-mail ao lojista: "seu plano foi ativado (cortesia de N meses)".

## Impacto no painel financeiro (as correções)
- **Total/Mês recebido** → passa a somar só `CONFIRMED` **com `method != "COURTESY"`**
  (cortesia tem amount 0, mas filtramos pra garantir e por clareza).
- **MRR** → soma só negócios com plano pago ativo **e `planIsCourtesy = false`**.
- **Novo card "Cortesias ativas"** → conta negócios com `planIsCourtesy = true` e plano vigente.
  Opcional: "receita potencial" (o que entraria se todas converterem) — pipeline, separado da receita.
- **Histórico** → linhas de cortesia aparecem marcadas como **"Cortesia"** (R$0), distintas dos pagamentos.

## Expiração (cron, já existe)
- O cron `/api/cron/expirar-planos` rebaixa plano vencido para FREE. Vamos adicionar:
  ao rebaixar, **`planIsCourtesy = false`** (limpa o flag).
- Lojista em cortesia: na página `/dashboard/plano`, em vez de "Plano ativo até X",
  mostrar **"Cortesia até DD/MM — renove para continuar"** (transparente + gatilho de conversão).

## Conversão cortesia → pago
- Quando o lojista realmente pagar, ele usa o fluxo normal ("Já paguei") → eu confirmo o
  `PaymentClaim` real. No confirm, setamos **`planIsCourtesy = false`** e estendemos o prazo.
  A partir daí ele entra no MRR e na receita normalmente.

## Garantias (o que NÃO muda / não quebra)
- Fluxo de pagamento manual real: intacto (só passa a setar `planIsCourtesy=false` no confirm,
  que já é o default).
- Gates de recurso por plano: idênticos (dependem de `business.plan`, não do flag).
- Expiração: mesma lógica, só limpa o flag a mais.
- Migração: `planIsCourtesy` nasce `false` para todos — nenhum dado existente muda de comportamento.

---

## Decisões em aberto (pra fechar 100%)
1. **Onde fica o botão "Liberar cortesia"?**
   (a) na lista de Negócios do admin, por linha; (b) numa tela de negócio do admin; (c) na tela de Pagamentos.
2. **O lojista vê que é cortesia?** Recomendo **sim** ("Cortesia até X — renove") — transparente e
   ajuda a converter. Alternativa: mostrar só "Premium" sem dizer que é cortesia.
3. **Duração padrão:** 1 mês (editável)?
4. **Card "receita potencial das cortesias"** no painel: incluir agora ou depois?

## Plano de implementação (após aprovação)
1. Schema: `Business.planIsCourtesy` + `db push` (aditivo).
2. Helper/rota: ação "liberar cortesia" (API admin) + botão no local escolhido.
3. Ajustar painel financeiro: filtros de receita + MRR + card de cortesias + tag no histórico.
4. Ajustar cron (limpar flag) e a página `/dashboard/plano` (texto "cortesia até X").
5. Ajustar confirm de pagamento real (setar flag false).
6. Teste: cortesia NÃO entra em receita/MRR; conversão entra; expiração limpa o flag.
