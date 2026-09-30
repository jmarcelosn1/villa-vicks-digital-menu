// Depois do build: dist/app.html vira dist/index.html (entrada padrão de qualquer hospedagem)
// e o HTML é reorganizado para a primeira tela aparecer rápido:
//   <head>  só o essencial da capa (CSS da capa, fontes Anton + Archivo, pré-carga do papel)
//   <body>  capa estática (#boot) → #root → resto do CSS → JavaScript → JSON-LD do cardápio
// Assim o navegador pinta o papel da abertura sem esperar os ~500 KB de JavaScript chegarem.
//
// Atenção: nada de String.replace com o JS/CSS como texto de substituição — o código minificado
// contém sequências como $` e $' que o replace interpretaria (duplicando o documento).
import { readFile, writeFile, unlink, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const from = path.join(dist, "app.html");
await access(from);
let html = await readFile(from, "utf8");

const take = (re, what) => {
  const m = re.exec(html);
  if (!m) throw new Error(`finalize-dist: não achei ${what}`);
  html = html.slice(0, m.index) + html.slice(m.index + m[0].length);
  return m[0];
};
const insertBefore = (marker, text, last = false) => {
  const i = last ? html.lastIndexOf(marker) : html.indexOf(marker);
  if (i < 0) throw new Error(`finalize-dist: não achei ${marker}`);
  html = html.slice(0, i) + text + html.slice(i);
};

const script = take(/<script type="module"[^>]*>[\s\S]*?<\/script>/, "o script do app");
const style = take(/<style rel="stylesheet"[^>]*>[\s\S]*?<\/style>/, "o CSS do app");
const menuLd = take(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*"@type":"Menu"[\s\S]*?<\/script>/, "o JSON-LD do cardápio");

// Fontes da capa (Anton e Archivo) sobem para o <head>; o resto do CSS vai para o fim do <body>.
const critical = [];
const rest = style.replace(/@font-face\{[^}]*\}/g, (rule) => {
  if (/font-family:\s*"?(Anton|Archivo Variable)"?;/.test(rule)) {
    // já embutidas no <head>: "block" evita pintar a capa com a fonte reserva e trocar em seguida
    critical.push(rule.replace("font-display:swap", "font-display:block"));
    return "";
  }
  return rule;
});
if (critical.length !== 2) throw new Error(`finalize-dist: esperava 2 fontes da capa, achei ${critical.length}`);

insertBefore("</head>", `    <style>${critical.join("")}</style>\n  `);
insertBefore("</body>", `${rest}\n${script}\n${menuLd}\n`, true);

const count = (t) => html.split(t).length - 1;
if (count("<body") !== 1 || count('id="boot"') !== 1 || count('type="module"') !== 1) throw new Error("finalize-dist: estrutura do HTML inesperada");

await writeFile(path.join(dist, "index.html"), html);
await unlink(from);

// robots.txt, sitemap.xml e página 404 (sem eles, o servidor devolvia o site inteiro para qualquer endereço)
const env = await readFile(path.resolve(dist, "../.env"), "utf8").catch(() => "");
const site = (process.env.VITE_SITE_URL ?? env.match(/^VITE_SITE_URL=(.*)$/m)?.[1] ?? "").trim().replace(/\/?$/, "/");
if (site !== "/") {
  await writeFile(path.join(dist, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${site}sitemap.xml
`);
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${site}</loc><lastmod>${today}</lastmod></url>
</urlset>
`,
  );
}
await writeFile(
  path.join(dist, "404.html"),
  `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Página não encontrada | Villa Vick's</title>
<style>
  html { background: #050505; color: #f5f5f5; font-family: system-ui, sans-serif; }
  body { min-height: 100vh; margin: 0; display: grid; place-items: center; text-align: center; padding: 24px; box-sizing: border-box; }
  h1 { font-size: clamp(2rem, 8vw, 3.5rem); margin: 0 0 12px; }
  p { color: #b9b9b9; margin: 0 0 28px; }
  a { display: inline-block; background: #e52023; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 28px; border-radius: 999px; }
</style>
</head>
<body>
<main>
  <h1>Página não encontrada</h1>
  <p>Esse endereço não existe no site da Villa Vick's.</p>
  <a href="/">Ir para o início</a>
</main>
</body>
</html>
`,
);
console.log(`✓ dist/index.html pronto (abre com dois cliques ou em qualquer hospedagem) — capa a ${Math.round(html.indexOf("<body") / 1024)} KB do início`);
