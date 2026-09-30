// Servidor estático mínimo para abrir o site já compilado em /dist — no computador e no celular (mesmo Wi-Fi).
// Suporta Range (HTTP 206), necessário para o vídeo da intro, e gzip nos textos (como qualquer hospedagem).
//
//   node scripts/serve-dist.mjs            só o servidor
//   node scripts/serve-dist.mjs --open     abre o site no navegador do computador
//   node scripts/serve-dist.mjs --celular  abre a página com o QR code para o celular escanear
import http from "node:http";
import os from "node:os";
import { createReadStream, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { createGzip } from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const FIRST_PORT = Number(process.env.PORT) || 4173;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4", ".webm": "video/webm", ".ico": "image/x-icon" };

if (!existsSync(path.join(ROOT, "index.html"))) {
  console.error("Pasta dist/ não encontrada. Rode: npm install && npm run build");
  process.exit(1);
}

/** Endereços deste computador na rede local, o do Wi-Fi primeiro (sem adaptadores virtuais). */
function lanAddresses() {
  const privateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
  const virtual = /(loopback|vethernet|virtualbox|vmware|hyper-v|wsl|bluetooth|docker|tailscale|zerotier|topaz)/i;
  const found = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== "IPv4" || a.internal || !privateIp.test(a.address) || virtual.test(name)) continue;
      found.push({ name, address: a.address, wifi: /(wi-?fi|wlan|wireless|sem fio)/i.test(name) });
    }
  }
  return found.sort((a, b) => Number(b.wifi) - Number(a.wifi));
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Página do computador com o QR code do endereço do site na rede local. */
async function phonePage(port) {
  const lan = lanAddresses();
  const urls = lan.map((l) => `http://${l.address}:${port}/`);
  let qr = "";
  if (urls[0]) {
    try {
      const { default: QRCode } = await import("qrcode");
      qr = await QRCode.toString(urls[0], { type: "svg", margin: 1, color: { dark: "#050505", light: "#ffffff" } });
    } catch {
      qr = ""; // sem o pacote (pasta copiada sem node_modules): fica só o endereço escrito
    }
  }
  const main = urls[0]
    ? `<div class="qr">${qr}</div><p class="url">${escapeHtml(urls[0])}</p>`
    : `<p class="warn">Não encontrei este computador numa rede Wi-Fi. Conecte o computador e o celular no mesmo Wi-Fi e recarregue esta página.</p>`;
  const others = urls.slice(1).map((u) => `<li>${escapeHtml(u)}</li>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Villa Vick's no celular</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#e8dcd0;color:#2b1a0e;font:17px/1.5 system-ui,sans-serif}
  main{max-width:34rem;padding:2rem;text-align:center}
  h1{margin:0 0 .25rem;font-size:2rem;color:#d11b22}
  .qr{width:17rem;margin:1.5rem auto .75rem;background:#fff;border-radius:1rem;padding:.75rem;box-shadow:0 6px 0 #a38c73}
  .qr svg{display:block;width:100%;height:auto}
  .url{font-size:1.35rem;font-weight:800;margin:.5rem 0 1.5rem;word-break:break-all}
  ol{text-align:left;margin:0 auto;max-width:28rem;padding-left:1.25rem}
  li{margin:.35rem 0}
  .warn{font-weight:700;color:#8a0a10}
  .alt{margin-top:1.25rem;font-size:.9rem;color:#5a4636}
  .alt ul{list-style:none;padding:0;margin:.25rem 0 0}
  a{color:#d11b22;font-weight:700}
</style></head><body><main>
<h1>Abrir no celular</h1>
<p>Aponte a câmera do celular para o código.</p>
${main}
<ol>
  <li>O celular precisa estar no <strong>mesmo Wi-Fi</strong> deste computador.</li>
  <li>Se o Windows perguntar sobre acesso à rede, clique em <strong>Permitir</strong> (rede privada).</li>
  <li>Deixe a janela preta do servidor aberta enquanto mostra o site.</li>
</ol>
${others ? `<div class="alt">Se não abrir, tente:<ul>${others}</ul></div>` : ""}
<p class="alt">No computador: <a href="/">abrir o site aqui</a></p>
</main></body></html>`;
}

function handler(port) {
  return async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (pathname === "/__celular") {
      const html = await phonePage(port);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(html);
    }
    let file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    // endereço sem extensão (ex.: /cardapio → cardapio.html), como na hospedagem
    if ((!existsSync(file) || statSync(file).isDirectory()) && existsSync(file + ".html")) file += ".html";
    if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(ROOT, "index.html");
    const { size } = statSync(file);
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? +range[1] : 0;
      const end = range[2] ? Math.min(+range[2], size - 1) : size - 1;
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
      return createReadStream(file, { start, end }).pipe(res);
    }
    if (/^(text\/|application\/(json|javascript)|image\/svg)/.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      res.writeHead(200, { "Content-Type": type, "Content-Encoding": "gzip", Vary: "Accept-Encoding" });
      return createReadStream(file).pipe(createGzip({ level: 6 })).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
    createReadStream(file).pipe(res);
  };
}

const openInBrowser = (url) => exec(process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`);

// Porta ocupada (ex.: o site já aberto em outra janela): tenta as próximas.
function listen(port, tries = 10) {
  const server = http.createServer(handler(port));
  server.once("error", (e) => {
    if (e.code === "EADDRINUSE" && tries > 0) return listen(port + 1, tries - 1);
    console.error("Não consegui iniciar o servidor:", e.message);
    process.exit(1);
  });
  // sem host: escuta em todas as interfaces (IPv4 e IPv6) — aceita o celular pela rede local
  server.listen(port, () => {
    const local = `http://localhost:${port}/`;
    console.log(`Villa Vick's rodando em ${local}  (feche esta janela para parar)`);
    for (const l of lanAddresses()) console.log(`No celular (mesmo Wi-Fi): http://${l.address}:${port}/   [${l.name}]`);
    if (process.argv.includes("--open")) openInBrowser(local);
    if (process.argv.includes("--celular")) openInBrowser(`${local}__celular`);
  });
}
listen(FIRST_PORT);
