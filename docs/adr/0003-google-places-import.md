# ADR 0003 — Importação via Google Places API (cold start)

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

Um guia comercial vazio não tem valor de descoberta para a Marina nem argumento de
venda para o Roberto. Precisamos popular a base antes do primeiro anunciante — resolver
o problema clássico de *cold start* de marketplaces.

## Decisão

**Importar negócios da Google Places API (New) e cachear no nosso banco como
`Business` com status `IMPORTED`.**

- `Nearby Search (New)` por tipo, em raio ao redor do Jardim Botânico.
- Mapeamento de `primaryType` do Google → `Category` do nosso domínio (`CATEGORY_MAP`).
- Dados cacheados no MySQL — **não** consultamos o Google a cada page view (custo + latência).
- Fotos: URL direta do endpoint `/media` (exibição apenas, conforme TOS), até 5 por negócio.
- Re-importação por `placeId` atualiza em vez de duplicar; `lastSyncedAt` audita a origem.

## Alternativas consideradas

- **Cadastro manual:** inviável para atingir massa crítica com 1h/dia.
- **Scraping:** frágil e fora dos termos de uso.
- **Baixar e hospedar as fotos (Vercel Blob):** o TOS do Places proíbe armazenamento
  permanente de fotos; servimos via URL direta e exibimos atribuição ao Google.

## Consequências

- (+) Guia populado desde o dia 1 → pitch "seu negócio já está aqui" para o Roberto.
- (+) Custo controlado: cache no banco, importação sob demanda pelo admin.
- (−) Dependência da cota/custo da Places API (mitigado: importação em lote pelo admin,
  não em tempo real).
- (−) Atribuição obrigatória "fornecido por Google" nas páginas que usam os dados.
