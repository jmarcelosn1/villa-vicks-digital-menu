# Villa Vick's — site de apresentação

Site institucional da Villa Vick's (Burger • Pizza • Grill — Itapecuru-Mirim).
Não é loja nem cardápio: vende a marca e leva o visitante aos cardápios externos. **Preços não aparecem na interface.**

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui (Button, Sheet) · GSAP + ScrollTrigger (`@gsap/react`) · Lucide.
Three.js do código de referência **não** foi usado: dele aproveitamos só a arquitetura (refs, rAF, resize, cleanup, animações de entrada).

## Ver o site

Dê **dois cliques no `index.html`** desta pasta. Ele abre o site pronto (`dist/index.html`) direto no navegador, sem servidor. O `Abrir site.bat` continua funcionando (serve em http://localhost:4173).

- `index.html` (raiz): só um atalho para `dist/index.html`.
- `app.html`: a página-fonte usada pelo Vite (`npm run dev` abre em http://localhost:5173/app.html).
- `dist/`: o site pronto. O HTML já traz JS, CSS e fontes embutidos; fotos e vídeos ficam em `dist/assets`. É esta pasta que vai para a hospedagem.

### Apresentar ao cliente

- **No computador:** dois cliques no `index.html`. Abre em ~0,3 s e funciona sem internet.
- **No celular:** dois cliques no `Abrir no celular.bat`. Abre no computador uma página com um QR code; o celular (no **mesmo Wi-Fi**) escaneia e abre o site. Na primeira vez o Windows pergunta sobre acesso à rede: clique em **Permitir** (rede privada). Deixe a janela preta aberta durante a apresentação. Se a porta 4173 estiver ocupada, o servidor usa a próxima livre.
- **Sem internet:** o site inteiro funciona; só o mapa do Google precisa de conexão. Sem ela, no lugar do mapa aparece um cartão com o endereço, e o mapa volta sozinho quando a conexão voltar. Os botões de WhatsApp, anota.ai e Instagram abrem sites externos: para demonstrar um pedido, use internet (ou o 4G do celular).

### Abertura rápida

O HTML é reorganizado no build (`scripts/finalize-dist.mjs`): no `<head>` fica só o essencial da capa (CSS, fontes Anton e Archivo, pré-carga do papel); a capa (`#boot` em `app.html`) é pintada antes do JavaScript. Ela fica na tela até o **primeiro toque ou rolagem**: o papel do React monta por baixo, invisível, e assume nesse momento (`src/lib/boot.ts`). As duas são idênticas, então a troca não aparece — e o navegador mede a abertura (LCP) pela capa, que chega em ~1 s mesmo no 4G lento. O vídeo da intro só começa a baixar depois que a primeira tela carrega.

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # gera /dist: typecheck + build em arquivo único (abre com dois cliques e serve em qualquer hospedagem)
npm run preview      # serve /dist em http://localhost:4173
npm run assets       # regera imagens/vídeos otimizados a partir de /source-assets (use -- --force para refazer tudo)
npm run menu-photos  # regera as fotos do cardápio (palco, miniatura e textura para file://)
```

Testes automatizados (Playwright, com `npm run preview` rodando):

```bash
npx playwright install webkit firefox                                  # uma vez
node scripts/qa.mjs --url http://localhost:4173/ --browsers edge,chrome,webkit,firefox   # screenshots + sincronismo scroll→vídeo + overflow + revelações
node scripts/qa-interactions.mjs --url http://localhost:4173/ --browser webkit           # menu mobile, links, fallback, reduced motion, âncora, rotação, scroll rápido
node scripts/check-type.mjs http://localhost:4173/                                       # títulos que estouram a coluna (320 → 2560 px)
```

`edge`/`chrome` usam os navegadores instalados (com H.264). O Chromium puro do Playwright não tem H.264 e cairia no WebM.

## Antes de publicar

- Defina o domínio real em `.env` → `VITE_SITE_URL` (usado em canonical, Open Graph e dados estruturados). O valor atual é um **placeholder**.
- Hospede como site estático (Vercel, Netlify, Cloudflare Pages, etc.) apontando para `dist/`.
- Garanta que o servidor responda `Accept-Ranges`/HTTP 206 para `.mp4` (padrão em todos os hosts citados) — o scrub do vídeo depende de requisições por intervalo.

## Estrutura

```
public/assets/
  branding/     logo com transparência (gerado do logo original)
  burger/       fotos reais Vick's + imagens de estúdio
  pizza/  grill/  drinks/  environment/  delivery/
  videos/       intro reencodada (MP4 H.264 + WebM VP9, desktop e mobile) + quadros inicial/final
source-assets/  TODOS os arquivos originais, intactos, organizados por categoria (ver README.md lá dentro)
scripts/
  build-assets.mjs   pipeline de imagens (AVIF/WebP/JPG + srcset), vídeo, logo, favicons e og-image
  fetch-menu-photos.mjs  baixa as fotos dos produtos do anota.ai (versão _600) para source-assets/cardapio/
  build-menu-photos.mjs  gera public/assets/cardapio/ (usa source-assets/cardapio-hd/ quando houver versão melhorada)
  qa.mjs / qa-interactions.mjs   testes com Playwright
src/
  components/BurgerScrollHero.tsx   intro: scroll → progresso → video.currentTime
  components/Header.tsx             header + menu mobile (Sheet)
  components/MenuShowcase.tsx       cardápio: abas Burger/Pizza/Grill + palco MorphGallery + lista de pratos
  components/ui/morph-gallery.tsx   galeria WebGL (dissolve com ruído) adaptada: texturas sob demanda, file://, fallback
  components/Sections.tsx           ambiente, atendimento, delivery, localização, Instagram, footer
  components/ui/wrapper-tear-reveal.tsx  embalagem kraft que rasga no início da intro e revela o burger
  components/MobileOrderBar.tsx     barra fixa "Pedir pelo WhatsApp" no celular
  components/OpenStatus.tsx         selo "Aberto agora / Abre às 18h" (fuso de Itapecuru-Mirim)
  data/site.ts                      links oficiais, horário, endereço e o CARDÁPIO (66 produtos do anota.ai, sem preços)
  lib/menu-store.ts                 cozinha aberta no cardápio (compartilhada com o menu do topo e #burger/#pizza/#grill)
  data/assets.generated.ts          gerado pelo pipeline (dimensões + srcsets)
```

## A intro (BurgerScrollHero)

| Progresso do scroll | O que acontece |
|---|---|
| 0% → ~14% | o papel de embalagem ("Bateu a fome? / VICK'S") racha, rasga e sai da tela acelerando |
| 9,4% → 68,75% | o vídeo do burger se monta, com frases que apresentam a Vick's. Começa com o papel ainda abrindo: a passagem é contínua |
| 68,75% → 88% | o hambúrguer assenta e se desloca: para cima no retrato, para a esquerda na paisagem (o menu do topo aparece em 88%) |
| 76,5% → 97% | VILLA VICK'S · BURGER • PIZZA • GRILL · horário · local · botões — junto com o assentar, sem trecho parado no fim |

A trilha tem 340svh no celular e 380svh no desktop. As frases ficam em `STEPS` (`src/components/BurgerScrollHero.tsx`); o papel é `src/components/ui/wrapper-tear-reveal.tsx`.

Desempenho no celular:

- O papel é desenhado **uma vez** em camadas (folha inteira, metade de cima, metade de baixo, sombras, rachadura). Durante o rasgo só mudam transform/opacity dessas camadas, que a placa de vídeo compõe. Redesenhar o SVG a cada quadro (o desenho do papel em alta resolução, 4× por ladrilho) derrubava a intro para ~12 quadros/s.
- O palco do vídeo fica invisível embaixo do papel até o **primeiro toque** na tela: assim a foto escondida não conta como "maior elemento" da abertura (LCP) e o custo de preparar o vídeo acontece antes de a página começar a andar.
- A galeria do cardápio só liga o WebGL com ela à vista e a rolagem parada.

Detalhes técnicos:

- O vídeo original tinha **um único keyframe** em 10 s. Scrub para trás travaria. Foi reencodado com keyframe a cada 5 quadros e sem B-frames.
- Versão mobile recortada no centro (800×720, ~2,2 MB) e versão desktop 1080p (~4,4 MB). VP9/WebM é usado só onde não houver H.264.
- ScrollTrigger calcula o progresso; um loop de `requestAnimationFrame` suaviza e aplica `video.currentTime` sem empilhar seeks (espera `seeking` terminar). Nenhum `setState` durante o scroll.
- O vídeo é baixado inteiro para a memória (`fetch` → Blob → `URL.createObjectURL`): cada seek só decodifica, sem nova requisição. Isso resolve o atraso do Safari, que não mantém vídeo em buffer. Se o navegador recusar `blob:`, volta para a URL normal automaticamente.
- Se os seeks estiverem lentos (>120 ms), o loop deixa de suavizar e mira direto no quadro final, convergindo em um único seek.
- O palco é `position: sticky` (mais estável que pin no iOS) com `100dvh`; o vídeo é dimensionado por `svh` para não "pular" quando a barra do navegador aparece.
- Safari (iOS/macOS): vídeo `muted` + `playsinline` e um `play()` pausado no próprio evento `play`, para liberar a decodificação de quadros sem o vídeo avançar sozinho.
- Quadros que nunca chegam (ex.: iOS em modo economia de energia): após 8 s rolando sem imagem, usa o fallback.
- Falha no vídeo (erro ou sem metadata em 12 s): mostra o quadro final (hambúrguer fechado) e a intro fica mais curta.
- `prefers-reduced-motion: reduce`: sem scrub. A intro vira uma tela estática com o hambúrguer fechado e a marca já visível.

## Sobre as fotos

As fotos reais do Vick's vieram em baixa resolução (≈300–450 px, capturas de Instagram). Por isso:
- são exibidas perto do tamanho nativo, em composições editoriais (sem esticar em tela cheia);
- ganharam versões 2× com lanczos para telas retina;
- artes com texto "chapado" (pizzas, burger, atendimento, ambiente) foram recortadas na versão web; o original continua em `source-assets/`.

Para um salto de qualidade visual, o ideal é o cliente enviar as fotos originais em alta resolução. Basta substituí-las em `source-assets/<categoria>/` (mesmo nome de arquivo) e rodar `npm run assets -- --force`.

## Cardápio

Um único palco (`#cardapio`) para as três cozinhas. As abas Burger / Pizza / Grill, as setas, o deslize e a lista de pratos trocam a foto pela MorphGallery (uma foto se dissolve na outra). Foto, nome, descrição e grupo ficam sempre sincronizados. Os links `#burger`, `#pizza` e `#grill` do menu abrem a aba certa.

- Nomes, descrições e fotos dos 66 produtos vêm dos cardápios do anota.ai (`source-assets/cardapio/catalogo.json`). Preços não aparecem no site.
- O que se repete em todos os itens de um grupo (pão brioche, massa de longa fermentação, acompanhamentos da jantinha) aparece uma vez só, na nota do grupo.
- Enquadramento: no desktop a foto fica fixa à esquerda, com tamanho pela altura da tela; no celular a foto encolhe para abas, foto e faixa de pratos caberem juntas acima da barra de pedido.
- Aberto com dois cliques (file://), o navegador não deixa foto local virar textura WebGL: cada foto também é gerada como `assets/cardapio/tex/*.js` (data URI), carregada só quando precisa.
- Fotos melhoradas (ex.: com IA): coloque em `source-assets/cardapio-hd/<categoria>/<slug>.png` e rode `npm run menu-photos` — o palco passa a usar 1200 px.

Para trocar itens, edite `MENU` em `src/data/site.ts` (o slug é o nome da foto).

## SEO local

Relatório da skill seo-local em `docs/LOCAL-SEO-ANALYSIS-villavicks.md` (nota, NAP, schema e 10 ações). O schema `Menu` é gerado no build a partir de `MENU` (`src/data/site.ts`).

## Créditos

A embalagem que rasga (`src/components/ui/wrapper-tear-reveal.tsx`) é adaptada do componente "Tiger Tear Reveal" (21st.dev): mantém a mecânica do rasgo e troca o tigre pela própria intro do site, que aparece pela abertura.
