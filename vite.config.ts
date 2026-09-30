import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import type { Plugin } from "vite";
import { MENU } from "./src/data/site";

import { cloudflare } from "@cloudflare/vite-plugin";

/**
 * Build pensado para abrir com dois cliques:
 * - base "./": todos os caminhos são relativos (funciona em file:// e em qualquer hospedagem);
 * - vite-plugin-singlefile: JS e CSS embutidos no HTML (o navegador bloqueia scripts separados em file://).
 * Fotos e vídeos continuam como arquivos em dist/assets.
 * Código-fonte da página: app.html (o index.html da raiz só redireciona para dist/index.html).
 */
/** SEO local: cardápio estruturado (Menu → MenuSection → MenuItem) gerado dos mesmos dados do site, sem preços. */
function menuSchema(site: string): Plugin {
  return {
    name: "villa-vicks-menu-schema",
    transformIndexHtml(html) {
      const menu = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": `${site}/#cardapio`,
        name: "Cardápio Villa Vick's",
        inLanguage: "pt-BR",
        hasMenuSection: MENU.map((c) => ({
          "@type": "MenuSection",
          name: c.title,
          description: c.headline,
          url: c.href,
          hasMenuSection: c.groups.map((g) => ({
            "@type": "MenuSection",
            name: g.name,
            ...(g.note ? { description: g.note } : {}),
            hasMenuItem: g.items.map((i) => ({
              "@type": "MenuItem",
              name: i.full ?? i.name,
              ...(i.desc ? { description: i.desc } : {}),
              image: `${site}/assets/cardapio/${c.id}/${i.slug}.webp`,
            })),
          })),
        })),
      };
      return html.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(menu)}</script>
  </head>`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    menuSchema(loadEnv(mode, process.cwd(), "VITE_").VITE_SITE_URL ?? ""),
    viteSingleFile({ removeViteModuleLoader: true }),
    cloudflare()
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: { port: 5173, host: true, open: "/app.html" },
  preview: { port: 4173, host: true },
  build: {
    target: ["es2020", "safari15", "firefox100", "chrome100", "edge100"],
    cssTarget: ["safari15", "firefox100", "chrome100"],
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "app.html"),
    },
  },
}));