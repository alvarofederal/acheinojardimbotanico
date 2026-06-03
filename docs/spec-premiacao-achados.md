# Spec — Prêmio "Achados" (premiação anual dos lojistas)

> **Status:** Proposta aprovada — construir ~2 meses antes de maio/2027.
> **Marco zero:** 1 de junho de 2026 (lançamento de produção).
> **Por que esperar:** os dados já são coletados desde o go-live; a feature dispara só
> daqui a ~1 ano. Construir perto da data evita retrabalho e respeita o gargalo (1h/dia).

## Contexto / objetivo

Premiar anualmente os lojistas que **mais divulgaram o próprio perfil** no Achei. É um
**loop de crescimento**: o lojista promove o link dele → traz tráfego → o guia cresce.
E vira PR/evento ("Achados 2026") com placa, post e barulho local.

## Os dados JÁ estão sendo guardados ✅

Nada a construir agora para a coleta. A contagem do 1º ano (jun/2026 → mai/2027) sai de:

- **`BusinessView`** — `{ businessId, date (@db.Date), count }`, único por (businessId, date).
- **`WhatsappClick`** — `{ businessId, date, count }`, mesmo formato.

Esses contadores **nunca são apagados** (o cron de expiração só mexe em plano). Logo, o
ranking do período é uma soma simples por negócio. **Garantido.**

> Verificação periódica recomendada: confirmar que os beacons de `view`/`whatsapp`
> seguem gravando após o go-live (1 checagem no painel admin já basta).

## Rankings (2)

1. **Mais contatados** — soma de `WhatsappClick.count` no período.
2. **Mais visitados** — soma de `BusinessView.count` no período.

Critérios a definir perto da data: top N (3? 5?), desempate, elegibilidade (só pagantes?
só reivindicados?), período exato.

## Telas a construir (perto de maio)

### Admin — `/dashboard/admin/premiacao` (último item do menu)
- Seletor de período (default: últimos 12 meses).
- Dois rankings lado a lado (mais contatados / mais visitados) com nome, foto, números.
- Botão **Publicar** → libera a página pública e fixa o resultado daquela edição.
- Nome/edição configurável (ex.: "Achados 2026").

### Pública — `/achados-2026` (slug configurável por edição)
- Página de divulgação do ranking premiado, identidade Flora.
- Pódio + lista, foto e nota de cada vencedor, selo "Achado 2026".
- Open Graph próprio (compartilhável).
- Só visível após o admin clicar Publicar.

## Modelo de dados (provável, definir na construção)

`AwardEdition { id, name, slug, periodStart, periodEnd, published, publishedAt, results Json }`
— `results` congela o ranking no momento da publicação (não recalcula depois).

## Brindes / evento (ideia do Álvaro)

- Placa física dos vencedores (produção própria — sublimação/corte).
- Evento de entrega com quitutes → barulho e marca na rua.
- Selo digital "Achado {ano}" no perfil do vencedor.

## Não-objetivos (v1)

- Votação popular (é por dados de uso, não voto).
- Categorias múltiplas de prêmio (começa com os 2 rankings).

---

*Ideia do Álvaro, jun/2026. Construir a UI perto de maio/2027 — dados já garantidos desde o go-live.*
