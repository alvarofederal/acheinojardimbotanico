# Insights Estratégicos — Rede Achei (log vivo)

> Registro corrido de perguntas estratégicas e as melhores respostas até aqui.
> Não é decisão final — é munição para decidir nos Gates. Cada entrada tem data.
> Princípio: passinho por passinho. Anotar agora, validar com dado na hora certa.

---

## 2026-06-12 — Economia da importação Google (chave, custo, quem paga)

**Perguntas do Álvaro:** No "Achei em Manaus", a chave do Google é minha ou do cliente?
Vou ter que arcar com a conta das importações quando tiver 100 municípios (o crédito
grátis do Google não cobre)?

### Resposta / tese atual

**1. Chave: CENTRAL (da Rede), nunca do operador.**
- O operador (Otávio) **não é técnico** — pedir pra ele criar projeto no Google Cloud,
  ativar a Places API e configurar billing com cartão **mata a venda no passo 1**.
- Uma chave central + **rastreio de uso por praça** (o sistema já tem o modelo `ApiUsage`
  e o painel `/dashboard/admin/custos`). Assim sei o custo exato de importar CADA praça.

**2. Quem paga: a Rede adianta, mas a TAXA DE SETUP reembolsa (+ margem).**
A conta fecha por causa de 3 fatos que mudam tudo:
- **Importação é evento ÚNICO por praça, não custo mensal.** Importa uma vez no onboarding.
- **Fotos já não recorrem:** migradas pro Cloudinary (cache). Não chama o Google a cada view.
  *(Esse trabalho que o Álvaro já fez no JBT é o que torna a Rede viável economicamente.)*
- **Após o cold start, a praça cresce de graça:** novos negócios entram por cadastro do
  operador ou auto-claim — **sem custo de Google**. O Google é só a semente.

→ Logo, com 100 praças **já importadas**, o custo recorrente do Google é ~zero. O gasto só
  aparece quando **entra praça nova** — e cada praça nova é paga pela **própria taxa de setup**.

**3. O número real já existe:** o custo de importar o JBT está no painel **Custos API**.
Esse é o valor a embutir na taxa de setup (R$997–2997). Se o setup é R$997 e a importação
custa ~R$50–150, sobra margem mesmo se o operador churnar no mês 2.

**4. Riscos a vigiar:**
- **Re-importação/atualização** (negócios mudam): vira custo recorrente se for solto.
  Mitigar: refresh sob demanda com **teto por plano** (o sistema já tem "teto de importação").
- **Pico de onboardings no mesmo mês** pode estourar o crédito grátis (~R$1.000/US$200/mês).
  Mitigar: enfileirar imports; o crédito grátis cobre ~N praças novas/mês de graça, o resto
  o setup paga; em escala, negociar preço de volume com o Google.
- **Plano B de fonte de dados:** OpenStreetMap (grátis, menos completo) + cadastro manual do
  operador reduzem dependência do Google com o tempo.

**Decisão preliminar:** chave central + custo por praça rastreado + setup cobre o import.
Revisar com números reais no Gate 3 (piloto).

---

## 2026-06-12 — Tela de tamanho de mercado por município (~5.500)

**Pergunta:** Teria uma tela mostrando quantos negócios cadastrados no Google em cada um
dos ~5.500 municípios?

### Resposta / tese atual

**Sim — e é uma arma de vendas (o "Atlas de Praças").** Mas o segredo é a FONTE de dado:

- ❌ **NÃO levantar via Google preemptivamente.** O Places API não dá "total de negócios numa
  cidade" de bandeja — exigiria milhares de buscas por município. Fazer isso pros 5.500 ANTES
  de vender custaria uma fortuna. Inviável.
- ✅ **Visão ampla (os 5.500): dados públicos GRÁTIS.** O **IBGE** (CEMPRE / Cadastro Central de
  Empresas) tem o nº de estabelecimentos formais por município. Proxy excelente de tamanho de
  mercado, **custo zero**. Dá pra montar o Atlas inteiro com isso + população + PIB per capita.
- ✅ **Profundidade (uma praça específica): Google sob demanda.** Só quando um alvo está sendo
  avaliado/onboardado a sério é que se gasta API pra ver a densidade real.

**Usos do Atlas:**
1. Priorização interna (quais municípios comportam praça — corte por nº de estabelecimentos).
2. **Venda ao operador:** "sua cidade tem ~1.200 empresas — esse é o seu mercado." Tangibiliza.
3. Mapa de exclusividade (quais praças estão livres/ocupadas).

**Quando construir:** Fase 3+ (não antes do Gate 1). Fonte IBGE primeiro; Google só no deep-dive.

---

## 2026-06-12 — Perfil ideal de operador (ICP)

**Insight do Álvaro:** Clientes de grande potencial seriam **radialistas** (conhecem a praça) e
**empresas de marketing** (conhecem o comércio local).

### Resposta / tese atual

**Insight afiadíssimo — e generaliza para uma regra:** o melhor operador é quem **já monetiza
a atenção local.** Para essa pessoa, a Rede não é "começar do zero", é **um produto novo pra
clientes que ele já tem.** Lista de alvos (do mais quente ao mais frio):

| Perfil | Por que é forte | Como alcançar |
|---|---|---|
| 🎙️ **Radialista / locutor local** | Conhece a praça, tem fama/confiança, **já vende anúncio pros mesmos comércios**, tem microfone pra divulgar o guia | Lista de rádios AM/FM do interior; abordagem direta |
| 📱 **Agência / social media MEI local** | Já atende comércio local, entende digital, quer **receita recorrente** pra somar ao serviço | Grupos de social media; Instagram de agências de cidade pequena |
| 📸 **Dono de perfil "Coisas de {Cidade}" no Insta** | **JÁ TEM A AUDIÊNCIA** (o lado população!) — só falta o produto de monetização. Quase operador pronto | Buscar perfis-agregadores por cidade no Instagram |
| 🏠 **Corretor de imóveis** | Conhece a cidade, DNA de vendas, rede local | Imobiliárias locais |
| 📰 **Dono de portal/jornal local** | Já faz mídia local, vende para anunciantes | Portais regionais |
| 🤝 **Representante comercial** | DNA de venda + rotas porta a porta já rodando | Sindicatos/associações de representantes |

**O traço que qualifica (filtro da entrevista):** (1) já tem relacionamento OU audiência local;
(2) confortável vendendo; (3) enxerga apelo em receita recorrente. Quem tem os 3 = green flag.

**Implicação no funil:** além do inbound (build in public → lista de espera), dá pra fazer
**outbound nominal** — uma lista de rádios e agências por região e abordar direto. O radialista
é talvez o melhor primeiro piloto: já tem praça, confiança e canal de divulgação num pacote só.

---

## Perguntas abertas (para validar nos Gates)

- Setup fee final: cobre import + tempo de onboarding + margem? (validar com custo real JBT)
- Refresh de dados: incluso com teto, ou cobrado à parte?
- Atlas de Praças: IBGE basta pra priorizar, ou precisa de camada Google no deep-dive?
- Exclusividade: por município? por microrregião? como tratar cidades-satélite (tipo o DF)?
- Operador ideal confirmado: rodar 1º piloto com um radialista valida a tese?
