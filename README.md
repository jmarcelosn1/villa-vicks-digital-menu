# Villa Vick's — Site Burger • Pizza • Grill

Um site moderno e responsivo para a hamburgueria, pizzaria e grill **Villa Vick's**, localizada em Itapecuru-Mirim, MA.

**[🔗 Ver ao vivo](https://villa-vicks.joaomarcelo7730.workers.dev)**

## ✨ Features

- **Intro animada** — Papel kraft rasgando na entrada, revela a marca com scroll suave
- **Cardápio completo** — 66 pratos (Burger, Pizza, Grill) com fotos
- **Cardápio digital para mesa** — QR code interno, lista otimizada para restaurante
- **Mapa estático otimizado** — OpenStreetMap renderizado como imagem (~50KB, zero latência)
- **Integração WhatsApp** — Botão com mensagem pré-preenchida por seção (burger, pizza, grill)
- **Performance** — Lighthouse 98+, <1s LCP, zero CLS
- **Mobile-first** — Totalmente responsivo, touch-otimizado
- **Viewport stável** — Sistema inteligente de altura de viewport (--vh, --svh) que evita pulos ao carregar address bar

## 🛠 Stack

- **React 19** + Vite 4
- **TypeScript**
- **Tailwind CSS v4**
- **GSAP** (ScrollTrigger para animações scroll)
- **Cloudflare Pages** (hospedagem)

## 🎨 Design

- **Tema escuro** com acentos em vermelho brand (#E52023)
- **Material kraft** — embalagem como metáfora visual
- **Tipografia** — Archivo + Anton (Google Fonts)
- **Animações contextuais** — movimento responde a scroll e interação, nunca gratuito

## 🚀 Como rodar localmente

```bash
# Instalar dependências
npm install

# Dev server (http://localhost:5173)
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura

```
src/
├── components/
│   ├── HeroIntro.tsx         # Seção de abertura com papel rasgando
│   ├── Sections.tsx           # Cards do cardápio por seção
│   ├── MapEmbed.tsx           # Mapa estático com pin
│   ├── Header.tsx             # Nav fixa no topo
│   └── ...
├── lib/
│   ├── stable-vh.ts           # Sistema de viewport height estável
│   ├── whatsapp.ts            # Links WhatsApp pré-preenchidos
│   └── ...
├── data/
│   └── site.ts                # Menu, contatos, metadados
└── styles/
    └── index.css              # Custom properties, animações

scripts/
├── build-map.mjs              # Gera imagens do mapa (OpenStreetMap → WebP)
├── build-cardapio.mjs         # Gera página HTML do cardápio digital
└── finalize-dist.mjs          # Robots.txt, sitemap, 404.html
```

## 🔧 Scripts úteis

```bash
npm run dev          # Dev server com HMR
npm run build        # Build produção
npm run preview      # Pré-visualizar build
npm run type-check   # Type checking (TypeScript)
```

## 🎯 Destaques técnicos

### Viewport Height Estável
Resolve o problema de jump ao aparecer/desaparecer a address bar em mobile:
- Rastreia altura mínima e máxima vista
- CSS custom properties `--vh` e `--svh`
- Suporte a reduced-motion

### Mapa estático
Substitui Google Maps por imagem gerada:
- Tiles OpenStreetMap downloadados e recoloridos para brand palette
- Renderizado como WebP (42-53KB vs 1MB do Google Maps)
- Zero latência, funciona offline
- Clique abre rota no Google Maps

### WhatsApp integrado
- Links dinâmicos por seção (burger/pizza/grill)
- Mensagens pré-preenchidas
- Redireção automática

## 📱 Responsivo

- **Mobile** (375px) — Otimizado para Instagram, WhatsApp browser
- **Tablet** (768px) — Layout adaptado
- **Desktop** (1280px+) — Experiência completa

## 🔐 SEO & Segurança

- ✓ Sitemap.xml gerado automaticamente
- ✓ Robots.txt configurado
- ✓ 404.html customizado
- ✓ LocalBusiness schema (JSON-LD)
- ✓ Open Graph tags para compartilhamento

## 📊 Performance

| Métrica | Resultado |
|---------|-----------|
| Lighthouse Performance | 98+ |
| LCP (Largest Contentful Paint) | <1s |
| FID (First Input Delay) | <100ms |
| CLS (Cumulative Layout Shift) | 0.0 |

## 📝 Licença

© 2026 João Marcelo — Projeto de portfólio. Código aberto para referência e estudo.

---

**Desenvolvido por [João Marcelo](https://github.com/jmarcelosn1)** — Criação de sites para negócios locais
