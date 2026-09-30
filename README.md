# Villa Vick's: site e cardápio digital

Site responsivo da hamburgueria, pizzaria e grill **Villa Vick's**, em Itapecuru-Mirim (MA), com cardápio completo, cardápio digital para as mesas e contato direto por WhatsApp.

**[Ver no ar](https://villa-vicks.joaomarcelo7730.workers.dev)**

**Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · GSAP · Cloudflare Workers (arquivos estáticos)

## O que o site entrega

- **Abertura animada:** papel kraft rasgando revela a marca, com rolagem suave.
- **Cardápio completo:** 66 pratos (Burger, Pizza e Grill) com foto.
- **Cardápio digital de mesa:** página própria, gerada no build, pensada para abrir por QR code no salão.
- **Mapa estático:** tiles do OpenStreetMap recoloridos na paleta da marca e servidos como imagem WebP (cerca de 50 KB), em vez de um mapa incorporado.
- **WhatsApp por seção:** links com mensagem pré-preenchida para burger, pizza e grill.
- **Mobile primeiro:** layout pensado para o navegador do Instagram e do WhatsApp, com toque otimizado.
- **SEO local:** `sitemap.xml`, `robots.txt`, `404.html`, schema `LocalBusiness` (JSON-LD) e tags Open Graph.

## Decisões de engenharia

**Altura de viewport estável.** A barra de endereço do celular aparece e some e faz a página "pular". `src/lib/stable-vh.ts` registra a menor e a maior altura vistas e expõe as variáveis CSS `--vh` e `--svh`, respeitando `prefers-reduced-motion`.

**Mapa como imagem.** `scripts/build-map.mjs` baixa os tiles, recolore para a paleta da marca e gera WebP. O resultado carrega sem requisição de terceiros e funciona offline; o clique abre a rota no Google Maps.

**Páginas geradas no build.** `scripts/build-cardapio.mjs` gera o HTML do cardápio de mesa e `scripts/finalize-dist.mjs` produz `robots.txt`, `sitemap.xml` e `404.html`, então o site publicado é 100% estático.

## Como rodar

```bash
npm install
npm run dev          # servidor de desenvolvimento em http://localhost:5173
npm run typecheck    # checagem de tipos
npm run build        # tipos, build, arquivos de SEO e cardápio de mesa
npm run preview      # build + servidor local do Cloudflare (wrangler dev)
npm run deploy       # build + publicação
```

## Estrutura

```
src/
  components/    Header, HeroIntro, Sections, MenuShowcase, MobileOrderBar, MapEmbed...
  lib/           stable-vh, whatsapp, menu-store, scroll-to, gsap...
  data/          menu, contatos e metadados (site.ts)
  hooks/
  index.css      propriedades customizadas e animações
scripts/
  build-map.mjs          imagens do mapa (OpenStreetMap para WebP)
  build-cardapio.mjs     página HTML do cardápio digital
  build-assets.mjs       otimização de imagens
  finalize-dist.mjs      robots.txt, sitemap e 404.html
docs/                    análise de SEO local
```

## Desenvolvimento com agentes de IA

O projeto foi desenvolvido com agentes de código (Claude Code). O repositório guarda o que orienta o agente: skills de design de interface, SEO local e performance web em `.agents/skills` e `.claude/skills` (versões travadas em `skills-lock.json`) e a análise de SEO local em `docs/`. O ciclo é: definir o comportamento e o conteúdo, deixar o agente implementar, e conferir o resultado com `npm run typecheck` e `npm run build` e no navegador antes de publicar.

## Créditos

Projeto de portfólio de [João Marcelo](https://github.com/jmarcelosn1): criação de sites para negócios locais.
