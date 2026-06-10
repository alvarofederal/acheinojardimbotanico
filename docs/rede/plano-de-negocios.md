# Plano de Negócios — Rede Achei (nome provisório)

> **Tese em uma frase:** transformar o Achei no Jardim Botânico (loja-modelo) numa **rede nacional de guias locais licenciados**, onde operadores locais fazem a venda na praça deles e nós fornecemos software, marca, método e prova.
>
> Criado em 2026-06-08 · Dono: Álvaro · Status: **tese aprovada, em validação (Fase 1)**

---

## 1. Sumário executivo

- **O problema do modelo atual:** o Achei JBT é um negócio de mídia hiperlocal. Audiência local não viaja, venda é porta a porta, ticket baixo (R$47,90–97,90). Escalar abrindo praças com o próprio tempo = comprar um segundo emprego.
- **A virada:** na era da IA, o software deixou de ser o ativo (qualquer um clona). O ativo é **playbook + loja-modelo + marca + rede**. O Achei JBT vira o protótipo e a prova; o produto nacional é **"um negócio de guia local pronto"** vendido a operadores.
- **Cliente nacional:** não é o comerciante — é o **operador local** (empreendedor que quer renda recorrente na cidade dele e não sabe montar a máquina).
- **Receita nacional:** setup + mensalidade por praça (software + marca + playbook + suporte). Margem de software, venda online, churn baixo *se o operador fatura*.
- **Regra de integridade:** nada é vendido a operador antes da loja-modelo provar receita. Sem prova, isso vira venda de fumaça — e não é o nosso jogo.

---

## 2. Os dois negócios (e como se alimentam)

| | **Achei JBT (loja-modelo)** | **Rede (licenciamento)** |
|---|---|---|
| Cliente | Comerciante do Jardim Botânico | Operador local (1 por praça) |
| Produto | Visibilidade + perfil + vitrine | Negócio pronto: plataforma white-label + playbook + marca |
| Ticket | R$47,90–97,90/mês | Setup R$997–2.997 + R$397/mês (piloto: ver §7) |
| Venda | Porta a porta / WhatsApp (Álvaro) | Online, nacional (conteúdo + lista de espera) |
| Papel na tese | **P&D + prova + vitrine da rede** | **O negócio escalável** |

Tudo que o JBT valida (script, preço, feature, material) vira ativo da rede. Tudo que a rede precisa (multi-tenant, wizard) é testado primeiro no JBT. **Um alimenta o outro — nenhum é descartável.**

---

## 3. Mercado (ordem de grandeza)

- Brasil: **5.570 municípios**; ~1.500 com 20 mil+ habitantes comportam um guia local com operador dedicado (número de ordem de grandeza, validar IBGE).
- Cada praça de porte médio comporta 30–100 anunciantes pagantes (validado por análogos: guias impressos de bairro, rádios locais, painéis de associação comercial).
- Análogos internacionais do modelo "mídia local + operador licenciado": Best Version Media e N2 Publishing (EUA) — décadas rodando com gente comum operando mídia hiperlocal sob método central. A IA barateou a parte cara (software) e deixou intacta a parte valiosa (método + prova + marca).
- Concorrência direta do B2C: Google Business (grátis). Nosso contra-posicionamento: curadoria local viva, WhatsApp como canal, vitrine de produtos, presença física (displays/cartões) e um humano da cidade cuidando — o que o Google não dá ao pequeno.

**Metas de captura (SOM):** ano 1 = 10 praças · ano 2 = 50 · ano 3 = 150.

---

## 4. Personas

1. **Roberto** (comerciante, JBT) — já documentado. Continua sendo o centro do dia a dia da loja-modelo.
2. **Otávio, o Operador** (novo, persona da rede): 25–50 anos, mora em cidade de 20k–300k hab., perfil comercial/comunicador (corretor, dono de agência pequena, MEI de marketing, militar da reserva, aposentado jovem). Quer renda recorrente e um negócio com método; **não é técnico e não quer ser**. Tem 5–10h/semana. Dor: "quero empreender mas não sei montar; curso de guru não entrega máquina".
3. **Marina** (moradora) — inalterada; é o combustível de audiência de toda praça.

---

## 5. Proposta de valor da rede (o que o operador compra)

1. **Plataforma pronta** na praça dele (white-label, subdomínio, negócios já importados via Places).
2. **Playbook de operação**: scripts de WhatsApp por categoria, roteiro porta a porta, materiais (display A6, cartão QR), precificação, cadência de follow-up — tudo testado no JBT com números.
3. **Marca e prova**: "funciona no Jardim Botânico, aqui estão os números".
4. **Exclusividade territorial** condicionada a meta (1 operador por praça; mantém se atingir mínimo de anunciantes ativos — ver §8).
5. **Comunidade e suporte**: grupo de operadores, call quinzenal, central de ajuda.

**A conta que fecha para o Otávio:** 20 anunciantes × R$97 ≈ R$1.940/mês na praça; paga R$397 à rede → sobra ~R$1.500/mês com 5–10h/semana. Em cidade média (100–300k hab.), 50–80 anunciantes = R$5–8k/mês. *Operador que ganha dinheiro não cancela* — esse é o motor do churn baixo da rede.

---

## 6. Modelo de receita da rede

| Fonte | Valor (referência) | Observação |
|---|---|---|
| Setup/entrada por praça | R$997 (piloto) → R$1.997–2.997 (escala) | Cobre onboarding, importação, treinamento. Filtro de seriedade. |
| Mensalidade por praça | R$397/mês | Fixa no piloto (simplicidade). Avaliar na escala: fixo + % sobre MRR excedente. |
| (Futuro) serviços | Materiais impressos, tráfego pago gerido, upgrade de domínio próprio | Opcional, nunca obrigatório. |

**Projeção simples (mensalidade apenas):** 10 praças = R$3,9k MRR · 50 = R$19,8k · 150 = R$59,5k MRR (~R$715k/ano).
**Custos centrais:** infra (R$200–500/mês), Places API (teto por praça incluso no plano; cache Cloudinary já corta o grosso), suporte (gargalo real — mitigar com automação/comunidade), contabilidade/jurídico.
**Valor de saída:** SaaS/licenciamento com MRR é ativo vendável (referência de mercado: 3–5× ARR). O Achei sozinho não é; a rede é.

---

## 7. Estrutura jurídica (leve primeiro, validar com profissional)

- **Fase piloto: contrato de licenciamento** de software + marca + método (licença de uso, não franquia formal). Mais simples e barato.
- **Franquia formal (Lei 13.966/2019, exige COF)** só quando o modelo estiver maduro (20+ operadores) — traz proteção e credibilidade, mas custo/burocracia.
- **Registro de marca no INPI**: verificar colisões para "Achei" (palavra comum) **cedo e barato** — antes de investir pesado no nome. ⚠️ Pendência prioritária da Fase 2.
- Dinheiro do anunciante → conta do operador (gateway dele). Dinheiro do operador → nossa conta. Sem intermediação de fundos no piloto (simplicidade fiscal).

---

## 8. Fases e GATES (a disciplina anti-"ideia é mato")

> Regra de ouro: **não se pula gate.** Cada fase só começa quando o gate anterior bate. Isso protege o foco e a integridade da oferta.

### Fase 1 — Provar a loja-modelo (AGORA → ~90 dias)
- Meta única: **10–20 anunciantes pagantes no JBT** (R$700–1.900 MRR).
- Só entra feature que sirva à venda do JBT.
- Já pode (custo zero): documentar a jornada em público (ver funil nacional) — audiência esquenta sem vender nada.
- **GATE 1→2: 10 pagantes ativos.**

### Fase 2 — Documentar o playbook (60 → 180 dias, sobrepõe a F1)
- Cada coisa que funcionar vira SOP escrito: scripts, rotas, objeções, preços, materiais.
- Verificar INPI + fechar naming + landing da rede com lista de espera.
- **GATE 2→3: 15–20 pagantes + playbook v1 completo + lista de espera ≥ 50 interessados.**

### Fase 3 — Piloto da rede (180 dias+)
- Multi-tenant no código (spec: `docs/rede/spec-onboarding-operador.md`).
- **2–3 operadores piloto, pagando desde o dia 1**, cidades de porte parecido com o JBT.
- Exclusividade condicionada: mínimo 10 anunciantes ativos até o mês 4, senão perde a praça.
- **GATE 3→4: ≥2 de 3 operadores renovando no mês 4 com meta batida.**

### Fase 4 — Escala (ano 2)
- Funil de aquisição de operadores rodando (conteúdo → lista → turmas).
- Onboarding self-service, comunidade, ranking de praças.
- Meta ano 2: 50 praças.

---

## 9. Riscos e mitigações (os 6 que importam)

| # | Risco | Mitigação |
|---|---|---|
| 1 | Loja-modelo não validar (JBT < 10 pagantes) | Foco total Fase 1; sem prova não há rede — melhor descobrir cedo e barato |
| 2 | Operador não vender (rede churna) | Seleção por entrevista, setup pago como filtro, playbook + rituais, exclusividade condicionada a meta |
| 3 | Google Business "já resolve grátis" | Posicionamento: curadoria + WhatsApp + vitrine + humano local + presença física |
| 4 | Suporte virar gargalo do Álvaro (1h/dia) | Multi-tenant central (zero instalação), wizard self-service, docs, comunidade que se auto-ajuda |
| 5 | Jurídico (licença × franquia, marca) | Licença simples no piloto; INPI cedo; advogado antes da Fase 3 |
| 6 | Custo Places API em escala | Teto de importação por plano; cache Cloudinary (já implementado); repasse de excedente |

---

## 10. Métricas norte

- **JBT (Fase 1):** anunciantes pagantes ativos · MRR · contatos/semana · taxa resposta → visita → fechamento.
- **Rede (Fase 3+):** praças ativas · MRR da rede · % operadores na meta (health score) · churn de operadores · NPS de operadores.
- **North Star do conjunto: MRR da rede.**

---

## 11. Papéis

- **Álvaro:** decisões, vendas (JBT agora, operadores depois), rosto do conteúdo, relacionamento com operadores.
- **Claude (eu):** software (multi-tenant, wizard, painéis), materiais de venda, documentação/playbook, análise de números, funis.
- O que **não** se terceiriza pra IA: falar com gente. É onde o negócio acontece.

---

*Documentos-irmãos: `funis-de-venda.md` (como vender os dois) e `spec-onboarding-operador.md` (como o operador entra sem fricção).*
