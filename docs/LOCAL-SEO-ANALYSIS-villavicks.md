# Análise de SEO local: Villa Vick's

Feita com a skill `seo-local` sobre o código do site (2026-09-26). O site ainda não está publicado, então não foi possível ver dados ao vivo do Google.

## Nota: 58/100 (site pronto, presença fora do site por fazer)

| Dimensão | Peso | Nota | Situação |
|---|---|---|---|
| Sinais do Perfil da Empresa no Google (GBP) | 25% | 10/25 | Mapa incorporado e link "Como chegar" apontando para o perfil. Categoria, fotos e posts do perfil não puderam ser verificados. |
| Avaliações e reputação | 20% | 2/20 | Nenhuma avaliação no site nem `aggregateRating` no schema, porque não temos dados reais (e nada foi inventado). |
| SEO local na página | 20% | 16/20 | Cidade no título e no H1, horário visível, telefone clicável (`tel:`), mapa com carregamento lento. Falta página própria por serviço (site de uma página). |
| NAP (nome, endereço, telefone) | 15% | 11/15 | Nome e telefone iguais na página e no schema. O endereço é "Vila Food, Arena Jesus", **sem rua, número e CEP**. |
| Schema local | 10% | 9/10 | `Restaurant` (subtipo certo), `geo` com 5+ casas decimais, horário, telefone, `areaServed`, `hasMenu` e um `Menu` completo (seções e itens, sem preços). |
| Autoridade local | 10% | 10/10* | *Não mensurável daqui (links, imprensa, listas "melhores de"). |

- **Tipo de negócio:** estabelecimento físico com delivery (híbrido).
- **Vertical:** restaurante (burger, pizza, grill).

## Consistência de NAP

| Fonte | Nome | Endereço | Telefone |
|---|---|---|---|
| Página (HTML) | Villa Vick's | Vila Food, Arena Jesus, Itapecuru-Mirim, MA | (98) 98595-1895 |
| Schema JSON-LD | Villa Vick's | Vila Food • Arena Jesus, Itapecuru-Mirim, MA, BR | +55 98 98595-1895 |
| Perfil no Google | não verificado | não verificado | não verificado |

Os dois conferem. Falta o endereço completo, que precisa ser igual no site, no schema e no Perfil da Empresa.

## 10 ações prioritárias

1. **Crítico:** conseguir com o cliente o endereço completo (rua, número, bairro, CEP) e colocar no site e no schema, igual ao do Perfil no Google.
2. **Crítico:** confirmar que o Perfil da Empresa no Google existe e está verificado, com categoria principal "Hamburgueria" (ou "Restaurante") e secundárias "Pizzaria" e "Churrascaria".
3. **Alto:** pedir avaliações no Google com regularidade (a meta da skill é ter avaliações novas pelo menos a cada 18 dias). Sem filtrar quem avalia: isso é proibido pelo Google.
4. **Alto:** quando houver 10 ou mais avaliações reais, mostrar a nota no site e adicionar `aggregateRating` ao schema.
5. **Alto:** definir o domínio definitivo e trocar o placeholder em `.env` (`VITE_SITE_URL`), que é usado no canonical, no Open Graph e no schema.
6. **Médio:** cadastrar o restaurante no Bing Places (alimenta ChatGPT e Copilot) e no Apple Maps (Apple Business Connect).
7. **Médio:** manter o perfil do Google com fotos reais recentes e posts de novidades e promoções.
8. **Médio:** listar o restaurante no iFood/anota.ai, TripAdvisor e Facebook com o mesmo NAP.
9. **Baixo:** criar páginas próprias para Burger, Pizza e Grill (a skill aponta páginas por serviço como o fator nº 1 de SEO local orgânico).
10. **Baixo:** buscar menções locais (imprensa de Itapecuru-Mirim, eventos na Arena Jesus, listas "onde comer").

## O que esta análise não mediu

- Posição no mapa do Google e no "local pack".
- Autoridade do domínio e backlinks.
- Dados do Perfil da Empresa (visualizações, ligações).
- Avaliações existentes.

Para isso existem ferramentas pagas como BrightLocal, Whitespark ou DataForSEO.
