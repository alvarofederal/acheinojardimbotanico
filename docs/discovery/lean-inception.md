# Lean Inception — Achei no Jardim Botânico

> Artefatos de descoberta do produto. Baseado no método de Paulo Caroli, adaptado para projeto solo + IA. Versionado em git — não é entregável de planejamento, é documento vivo.

---

## 1. Visão do Produto (Geoffrey Moore Template)

**PARA** moradores e visitantes do Jardim Botânico (DF) e bairros adjacentes
**QUE** precisam encontrar negócios, serviços e estabelecimentos próximos com informações confiáveis e atualizadas,
**O Achei no Jardim Botânico** é um **guia comercial digital hiperlocal**
**QUE** centraliza os negócios da região com fotos, horários, contato direto via WhatsApp e avaliações reais,
**DIFERENTE DE** Google Maps (genérico, sem curadoria local), Instagram (precisa saber o nome do negócio antes), grupos de WhatsApp (informação solta e perdida),
**NOSSO PRODUTO** entrega curadoria local profissional, fotografia própria dos estabelecimentos parceiros e um painel onde o dono do negócio gerencia sua presença digital sem precisar contratar agência.

---

## 2. Produto É / Não É / Faz / Não Faz

| **É** | **NÃO É** |
|---|---|
| Um guia comercial digital hiperlocal | Um marketplace de produtos (não vendemos transação) |
| Um catálogo curado de negócios da região | Um portal de notícias |
| Uma plataforma de presença digital paga | Um serviço de delivery |
| Uma ponte entre comerciante e cliente local | Uma rede social |
| Um espaço de credibilidade (avaliações, fotos profissionais) | Um classificado de usados |

| **FAZ** | **NÃO FAZ** |
|---|---|
| Lista negócios por categoria e proximidade | Processa pagamentos entre cliente e estabelecimento |
| Importa dados iniciais via Google Places API | Faz reservas/agendamentos (v1) |
| Permite ao dono reivindicar e gerenciar perfil | Modera reviews (v1 — usa só as do Google) |
| Cobra mensalidade do anunciante por destaque | Vende anúncios via leilão tipo Google Ads |
| Tira fotos profissionais para planos pagos | Cria conteúdo editorial diário |

---

## 3. Personas

### Marina, 34 — moradora estabelecida

**Perfil:** Casada, 2 filhos, órgão público, renda familiar R$15-25k/mês, mora há 4 anos no JBT.

**Dores:**
- Não conhece a maioria dos comércios novos dos últimos 2 anos
- Google Maps desatualizado ou com resultados de todo o DF
- Sem tempo para pesquisar — quer resposta rápida no celular

**Ganhos buscados:**
- Encontrar opções perto de casa em menos de 1 minuto
- Saber se o lugar está aberto agora antes de sair
- Prova social de outros moradores da própria região

**Como chega:** Busca Google ("cabeleireiro infantil jardim botanico df"), grupo de WhatsApp do condomínio, Instagram da marca.

---

### Roberto, 47 — dono de pet shop no JK

**Perfil:** Pet shop pequeno (3 funcionários), 5 anos de operação, faturamento R$30-50k/mês. Sem formação em marketing. Trabalha de balcão.

**Dores:**
- Sente que está invisível no digital comparado a redes maiores
- Já gastou dinheiro em tráfego pago sem resultado
- Não sabe se vale a pena ter site, perfil no Google Meu Negócio, etc.

**Ganhos buscados:**
- Aparecer quando o vizinho buscar "pet shop perto de mim"
- Pagar pouco com resultado mensurável (visitas, contatos via WhatsApp)
- Não ter que mexer em tecnologia complicada

**Como chega:** O operador (Álvaro) bate na porta com tablet mostrando o perfil já pronto, importado via Places API.

> **Roberto é a persona de conversão do MVP.** Toda feature nova é testada: "isso ajuda o Roberto a ver valor e pagar?"

---

### Álvaro — operador e admin

**Necessidades:**
- Painel admin para aprovar reivindicações rapidamente
- Importação em massa via Places API com 1 clique
- Visão financeira (assinaturas ativas, MRR)
- Criar/editar negócios manualmente quando a API falha ou retorna dado ruim
- Logs de auditoria

> Persona geralmente esquecida. O painel admin precisa ser tão bom quanto o painel público — o operador vai usar todo dia.

---

## 4. Jornadas de Usuário

### Jornada Marina — descoberta via SEO

```
1. Precisa de cabeleireiro infantil para o filho
2. Pesquisa "cabeleireiro infantil jardim botanico df" no Google
3. Encontra link do Achei no top 3 (SEO local)
4. Acessa categoria "Salão / Cabeleireiro"
5. Filtra "atende crianças" + ordena por distância
6. Vê 3 opções: foto, avaliação, horário de hoje, botão WhatsApp
7. Clica "Abrir WhatsApp" → conversa com o salão
8. Agenda
```

**Hipótese central do negócio:** se Marina não chega via SEO, Roberto não vê visualizações, Roberto não paga. SEO é o fundamento de tudo.

---

### Jornada Roberto — de descoberto a anunciante

```
1. Operador bate na porta com tablet
2. "Seu pet shop já está listado aqui no Achei do Jardim Botânico"
3. Roberto vê perfil dele (importado: nome, endereço, foto antiga do Google)
4. "Sem custo nenhum hoje. Quer reivindicar para personalizar?"
5. Roberto reivindica (email + CNPJ + telefone)
6. Operador ajuda a colocar foto melhor, descrição, WhatsApp direto
7. 2 semanas depois, operador volta com relatório:
   "47 visualizações, 8 cliques no WhatsApp"
8. Oferta: "R$79/mês → destaque na categoria + foto profissional"
9. Roberto fecha → cliente pago
```

---

## 5. Análise Estratégica — Lean Canvas

| Bloco | Conteúdo |
|---|---|
| **Problema** | (1) Moradores não encontram negócios locais com info confiável. (2) Comerciantes sem presença digital nem tempo/dinheiro para agência. (3) Indicações perdidas em grupos de WhatsApp. |
| **Segmentos** | Primário: moradores Jardim Botânico/Lago Sul. Secundário: comerciantes locais 1-10 funcionários. |
| **Proposta Única** | Guia hiperlocal curado, foto profissional, contato direto. |
| **Solução** | Plataforma web mobile-first: listagem por categoria/distância, perfil rico, WhatsApp, painel do anunciante. |
| **Canais** | SEO local, Instagram (@acheinojardimbotanico), visita presencial, QR code físico. |
| **Receita** | Assinatura: Free / Visibilidade R$79 / Premium R$197. Sem comissão. |
| **Custos** | Vercel ~R$50/mês, MySQL ~R$30/mês, domínio ~R$50/ano, Google Places (free tier). |
| **Métricas-chave** | Negócios listados, negócios reivindicados, anunciantes pagos, MRR, sessões/mês, cliques WhatsApp. |
| **Vantagem injusta** | Curadoria local manual + foto profissional + operador é morador e dev. Combinação rara. |

---

## 6. Análise Competitiva

| Concorrente | Força | Fraqueza | Diferencial do Achei |
|---|---|---|---|
| Google Maps | Onipresente, gratuito | Genérico (todo Brasil), sem curadoria | Hiperlocal, identidade de bairro, curadoria |
| Instagram dos comércios | Visual, social | Cliente precisa saber o nome antes | Descoberta por categoria + proximidade |
| Grupos de WhatsApp | Confiança alta | Informação perdida, não pesquisável | Persistência + busca + organização |
| acheisantamaria.com.br | Modelo provado | UX dos anos 2010, sem foto profissional | UI moderna, plano premium com foto |
| iFood / Rappi | Delivery de comida | Comissão alta, só restaurantes | Sem comissão, cobre todas categorias |

---

## 7. Modelo de Monetização

**Free** — listagem básica importada, aparece após pagos nas buscas.

**Visibilidade — R$79/mês** — destaque na categoria, descrição personalizada, WhatsApp direto, galeria até 6 fotos, relatório mensal de visualizações.

**Premium — R$197/mês** — tudo do Visibilidade + foto profissional tirada pelo operador + banner rotativo na home + destaque com selo + galeria até 20 fotos + post no Instagram mensal.

**Projeção realista:**
```
Mês 3:   3 pagos → ~R$237 MRR
Mês 6:  10 pagos → ~R$790 MRR
Mês 12: 25 pagos → ~R$2.500 MRR
Mês 18: 50 pagos → ~R$5.000 MRR (teto da região)
```
Para escalar além do teto: replicar o modelo em outras regiões (Lago Sul, Sudoeste, Águas Claras).

---

## 8. MVP Canvas

**Objetivo:** Validar se moradores usam o guia para descoberta E se comerciantes pagam por destaque.
**Métrica de sucesso em 90 dias:** 5 anunciantes pagos OU 1.000 sessões orgânicas/mês.

**Features do MVP (apenas estas):**
1. Listagem por categoria
2. Busca textual + filtro "aberto agora"
3. Página de detalhe com galeria + WhatsApp
4. Importação via Places API (1ª carga)
5. Cadastro / login
6. Reivindicação de perfil
7. Painel do anunciante básico (editar descrição, foto, WhatsApp)
8. Painel admin (aprovar, importar, criar manual)
9. Checkout assinatura — plano Visibilidade R$79 (1 plano no MVP)
10. Métricas básicas para anunciante

**Fora do MVP:** mapa interativo, avaliações próprias, posts editoriais, favoritos, newsletter, Beatriz como persona de produto.

---

## 9. Sequencer (releases)

| Release | Foco | Saída concreta | Semanas |
|---|---|---|---|
| 0 — Base | Limpeza Courtesyfy + auth + estrutura | Repo limpo rodando localmente | 0-1 |
| 1 — Public Read-only | Importação Places + listagem + detalhe + WhatsApp | Site público com 200+ negócios | 2-3 |
| 2 — Claim & Manage | Login + reivindicação + painel anunciante free + admin | Comerciante reivindica e edita | 4-5 |
| 3 — Monetize | Checkout Asaas + plano Visibilidade + métricas | Aceita R$79/mês | 6-8 |
| 4 — Polish & Scale | SEO técnico + Open Graph + sitemap + filtros | 1.000+ sessões/mês orgânicas | 9-12 |

---

*Criado em: 2026-05-21 | Baseado em spec.md Partes 1, 3, 4*
