// Cardápio digital da MESA (QR code na mesa): uma página separada (dist/cardapio.html →
// villavicks.pages.dev/cardapio), gerada dos MESMOS dados do site (src/data/site.ts).
// Só o cardápio: sem preços e sem botões de pedido (quem está na mesa pede ali mesmo).
// Abre também com dois cliques (fontes embutidas, caminhos relativos).
//
// Direção visual (quem usa: alguém sentado à mesa, à noite, decidindo o que pedir):
//   • o papel kraft do embrulho é o material da marca: capa rasgada + uma tira rasgada abrindo
//     cada cozinha — é o único elemento "ousado"; o resto fica quieto e legível no escuro;
//   • lista de cardápio (foto à esquerda, ingredientes COMPLETOS), não grade de cartões:
//     na mesa a pessoa lê o que vem no prato;
//   • movimento só na capa (uma vez) e em resposta ao toque (seletor, folha do prato).
// Roda no fim do `npm run build`.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const { MENU, SITE } = await import(pathToFileURL(path.join(root, "src/data/site.ts")).href);

const env = await readFile(path.join(root, ".env"), "utf8").catch(() => "");
const site = (process.env.VITE_SITE_URL ?? env.match(/^VITE_SITE_URL=(.*)$/m)?.[1] ?? "").trim().replace(/\/?$/, "/");

// Fontes da marca (subconjunto latino, cobre o português), embutidas: em file:// o navegador
// bloqueia arquivo de fonte separado.
const font = async (f) => "data:font/woff2;base64," + (await readFile(path.join(root, "node_modules", f))).toString("base64");
const anton = await font("@fontsource/anton/files/anton-latin-400-normal.woff2");
const archivo = await font("@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2");

// Papel kraft em versão leve (o original tem 240 KB; no 4G da mesa a capa precisa ser instantânea).
await sharp(path.join(root, "public/assets/branding/papel-embalagem.webp"))
  .resize({ width: 1000 })
  .webp({ quality: 58, effort: 6 })
  .toFile(path.join(dist, "assets/cardapio/capa-papel.webp"));

// Bordas rasgadas (SVG). Semente fixa → o mesmo rasgo a cada build; cada borda com o seu.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const tear = (amp, base) => {
  let d = `M0 40 L0 ${base}`;
  for (let x = 0; x <= 1000; x += 9 + rnd() * 16) d += ` L${x.toFixed(1)} ${(base - rnd() * amp).toFixed(1)}`;
  return d + ` L1000 ${base} L1000 40 Z`;
};
// fibras claras do papel por trás do escuro que "morde" a borda
const rip = (cls) => `<svg class="${cls}" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="${tear(15, 25)}" fill="#fbf5ea"/><path d="${tear(11, 30)}" fill="#150e0b"/></svg>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const photo = (cat, slug) => `assets/cardapio/${cat}/${slug}`;

const dish = (cat, g, it) => {
  const name = it.full ?? it.name;
  const src = photo(cat, it.slug);
  return `<li><button class="dish" type="button" data-cat="${cat}" data-img="${src}.webp" data-name="${esc(name)}" data-group="${esc(g.name)}" data-desc="${esc(it.desc ?? "")}" data-note="${esc(g.note ?? "")}">
<span class="ph"><img src="${src}-thumb.webp" srcset="${src}-thumb.webp 200w, ${src}.webp 600w" sizes="108px" width="108" height="108" loading="lazy" decoding="async" alt=""></span>
<span class="tx"><span class="nm">${esc(name)}</span>${it.desc ? `<span class="ds">${esc(it.desc)}</span>` : ""}</span>
</button></li>`;
};

const sections = MENU.map(
  (c) => `<section id="${c.id}" class="cat" aria-labelledby="t-${c.id}">
<header class="band">
${rip("rip rip-top")}
<div class="wrap">
<h2 id="t-${c.id}">${esc(c.title)}</h2>
<p class="promise">${esc(c.headline)}</p>
${c.notes?.length ? `<ul class="notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
</div>
${rip("rip rip-bottom")}
</header>
<div class="wrap">
${c.groups
  .map(
    (g) => `<div class="group">
<h3>${esc(g.name)}</h3>${g.note ? `<p class="gnote">${esc(g.note)}</p>` : ""}
<ul class="list">${g.items.map((it) => dish(c.id, g, it)).join("")}</ul>
</div>`,
  )
  .join("")}
</div>
</section>`,
).join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Cardápio | Villa Vick's — Burger, Pizza e Grill</title>
<meta name="description" content="Cardápio da Villa Vick's: burgers artesanais, pizzas de longa fermentação e grill na brasa.">
<meta name="theme-color" content="#150e0b">
${site !== "/" ? `<link rel="canonical" href="${site}cardapio">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="Cardápio | Villa Vick's">
<meta property="og:description" content="Burgers artesanais, pizzas de longa fermentação e grill na brasa.">
<meta property="og:url" content="${site}cardapio">
<meta property="og:image" content="${site}og-image.jpg">` : ""}
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" as="image" href="assets/cardapio/capa-papel.webp">
<script>document.documentElement.className="js"</script>
<style>
@font-face{font-family:"Anton";src:url(${anton}) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:"Archivo";src:url(${archivo}) format("woff2-variations");font-weight:100 900;font-display:swap}
:root{
  --brasa:#150e0b;--brasa-2:#1d1410;--risco:#34271f;
  --kraft:#eadcc6;--tinta:#2a1a12;
  --vermelho:#e52023;--vermelho-texto:#ff5c55;--dourado:#c9a45c;
  --texto:#f4ece1;--apagado:#b9aa9b;
  --display:"Anton",Impact,"Arial Narrow",sans-serif;--sans:"Archivo",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --ease:cubic-bezier(.16,1,.3,1)}
*{box-sizing:border-box}
html{background:var(--brasa);color:var(--texto);font:400 16px/1.5 var(--sans);-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent;scroll-padding-top:72px}
body{margin:0;min-height:100vh;background:var(--brasa)}
a{color:inherit}
img{display:block}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px}

/* capa */
.cover{position:relative;min-height:min(74vh,660px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 20px 88px;overflow:hidden;
  background:radial-gradient(ellipse 72% 56% at 50% 48%,rgba(234,220,198,.94),rgba(234,220,198,.7) 58%,rgba(234,220,198,.4)),url(assets/cardapio/capa-papel.webp) center/cover,var(--kraft);color:var(--tinta)}
.cover .ask{margin:0;font-weight:700;font-size:clamp(1.15rem,4.8vw,1.5rem)}
.cover h1{margin:.16em 0 0;font:400 clamp(5rem,25vw,10rem)/.86 var(--display);color:var(--vermelho);text-shadow:0 .03em 0 rgba(110,8,12,.28)}
.cover .who{margin:18px 0 0;font:400 clamp(1.5rem,6.4vw,2.1rem)/1 var(--display)}
.cover .what{margin:6px 0 0;font-weight:600;font-size:1rem}
.cover .hint{position:absolute;left:0;right:0;bottom:52px;margin:0;font-size:.88rem;color:rgba(42,26,18,.7)}
.js .cover > p,.js .cover > h1{opacity:0;transform:translateY(12px);animation:rise .9s var(--ease) forwards}
.js .cover .ask{animation-delay:.05s}.js .cover h1{animation-delay:.15s}.js .cover .who{animation-delay:.32s}.js .cover .what{animation-delay:.42s}.js .cover .hint{animation-delay:.7s}
@keyframes rise{to{opacity:1;transform:none}}
.rip{position:absolute;left:0;width:100%;height:30px;display:block}
.rip-bottom{bottom:-1px}
.rip-top{top:-1px;transform:rotate(180deg)}

/* seletor das cozinhas */
nav{position:sticky;top:0;z-index:20;background:rgba(21,14,11,.92);-webkit-backdrop-filter:saturate(1.2) blur(10px);backdrop-filter:saturate(1.2) blur(10px);border-bottom:1px solid var(--risco)}
.seg{position:relative;display:grid;grid-template-columns:repeat(3,1fr);max-width:520px;margin:0 auto;padding:10px 18px}
.seg a{position:relative;z-index:1;padding:12px 4px;text-align:center;text-decoration:none;font:400 1.12rem/1.2 var(--display);letter-spacing:.03em;color:var(--apagado);transition:color .35s}
.seg a[aria-current="true"]{color:#fff}
.seg .ind{position:absolute;top:10px;bottom:10px;left:18px;width:calc((100% - 36px)/3);border-radius:999px;background:var(--vermelho);transition:transform .5s var(--ease)}

/* tira de papel que abre cada cozinha */
.cat{padding-bottom:12px}
.band{position:relative;margin-top:28px;padding:52px 0 50px;background:linear-gradient(rgba(234,220,198,.9),rgba(234,220,198,.9)),url(assets/cardapio/capa-papel.webp) center/1000px auto,var(--kraft);color:var(--tinta)}
.band h2{margin:0;font:400 clamp(2.9rem,13vw,4.6rem)/.95 var(--display)}
.promise{margin:8px 0 0;font-weight:700;font-size:1.05rem;color:#b3141a}
.notes{list-style:none;padding:0;margin:16px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.notes li{border:1.5px solid rgba(42,26,18,.35);border-radius:999px;padding:6px 13px;font-size:.9rem;font-weight:600}

/* grupos e pratos: lista de cardápio */
.group{margin-top:34px}
.group h3{margin:0;font:400 1.9rem/1.1 var(--display);color:var(--dourado)}
.gnote{margin:4px 0 0;color:var(--apagado);font-size:.95rem;max-width:60ch}
.list{list-style:none;padding:0;margin:10px 0 0}
@media (min-width:760px){.list{display:grid;grid-template-columns:1fr 1fr;column-gap:40px}}
.list li{border-bottom:1px solid var(--risco)}
.dish{all:unset;box-sizing:border-box;cursor:pointer;display:flex;gap:16px;align-items:flex-start;width:100%;padding:16px 0}
.dish:focus-visible{outline:3px solid var(--vermelho);outline-offset:4px;border-radius:6px}
.ph{flex:none;width:108px;height:108px;border-radius:14px;overflow:hidden;background:var(--brasa-2)}
.ph img{width:100%;height:100%;object-fit:cover;transition:transform .25s var(--ease),opacity .5s}
.dish:active .ph img{transform:scale(.95)}
.tx{display:flex;flex-direction:column;gap:4px;min-width:0;padding-top:2px}
.nm{font-weight:700;font-size:1.13rem;line-height:1.2}
.ds{color:var(--apagado);font-size:.95rem;line-height:1.45}
.js .ph img{opacity:0}.js .ph img.ok{opacity:1}

footer{margin-top:40px;padding:40px 20px max(44px,env(safe-area-inset-bottom));text-align:center;color:var(--apagado);font-size:.92rem;border-top:1px solid var(--risco)}
footer img{width:160px;height:auto;margin:0 auto 16px}
footer p{margin:5px 0}
footer b{color:var(--texto);font-weight:600}
footer a{color:var(--texto);font-weight:700;text-underline-offset:3px}
footer .fine{margin-top:18px;font-size:.8rem}

/* folha do prato (sobe de baixo; responde ao toque) */
dialog{position:fixed;inset:auto 0 0 0;margin:0 auto;width:100%;max-width:560px;max-height:calc(100dvh - 20px);border:0;padding:0;background:var(--brasa-2);color:var(--texto);border-radius:24px 24px 0 0;overflow:hidden;box-shadow:0 -18px 50px rgba(0,0,0,.55);transform:translateY(100%);transition:transform .5s var(--ease)}
dialog.on{transform:none}
dialog::backdrop{background:rgba(8,5,4,0);transition:background .4s}
dialog.on::backdrop{background:rgba(8,5,4,.74)}
@media (min-width:760px){dialog{inset:0;margin:auto;border-radius:24px;max-height:min(90vh,860px);opacity:0;transform:translateY(20px);transition:transform .45s var(--ease),opacity .3s}dialog.on{opacity:1;transform:none}}
.sheet{display:flex;flex-direction:column;max-height:inherit;overflow:auto;overscroll-behavior:contain}
.grab{position:absolute;top:9px;left:50%;width:42px;height:5px;margin-left:-21px;border-radius:9px;background:rgba(255,255,255,.6);z-index:3}
@media (min-width:760px){.grab{display:none}}
.sp{position:relative;flex:none;aspect-ratio:1;overflow:hidden;background:var(--brasa);touch-action:pan-y}
.sp img{width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease),opacity .25s}
.out-l img{transform:translateX(-16%);opacity:0}.out-r img{transform:translateX(16%);opacity:0}
.close{position:absolute;top:14px;right:14px;z-index:3;border:0;border-radius:999px;padding:10px 16px;font:700 .9rem var(--sans);color:#fff;background:rgba(21,14,11,.7);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer}
.close:focus-visible{outline:3px solid var(--vermelho);outline-offset:2px}
.body{padding:18px 22px 26px}
.meta{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-weight:600;font-size:.9rem}
.meta .grp{color:var(--dourado)}.meta .pos{color:var(--apagado)}
.body h4{margin:6px 0 0;font:400 clamp(2.2rem,9.5vw,2.9rem)/1 var(--display)}
.body .d{margin:12px 0 0;font-size:1.05rem;line-height:1.55;color:#e2d7ca}
.body .n{margin:14px 0 0;padding-top:14px;border-top:1px solid var(--risco);font-size:.92rem;line-height:1.45;color:var(--apagado)}
.swipe{margin:16px 0 0;font-size:.82rem;color:var(--apagado)}
@media (hover:hover) and (pointer:fine){.swipe{display:none}}

@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.js .cover > p,.js .cover > h1{opacity:1;transform:none}}
</style>
</head>
<body>
<header class="cover">
<p class="ask">Bateu a fome?</p>
<h1>Cardápio</h1>
<p class="who">Villa Vick's</p>
<p class="what">Burger, pizza e grill</p>
<p class="hint">Toque num prato para ver a foto grande</p>
${rip("rip rip-bottom")}
</header>
<nav aria-label="Cozinhas"><div class="seg"><span class="ind" aria-hidden="true"></span>${MENU.map((c, i) => `<a href="#${c.id}"${i === 0 ? ' aria-current="true"' : ""}>${esc(c.label)}</a>`).join("")}</div></nav>
<main>
${sections}
</main>
<footer>
<img src="assets/branding/logo-640.webp" width="640" height="385" loading="lazy" alt="Villa Vick's">
<p><b>${esc(SITE.days)}</b>, das ${esc(SITE.hours)}</p>
<p>Vila Food, Arena Jesus, ${esc(SITE.city)}/${esc(SITE.state)}</p>
<p>Siga <a href="${esc(SITE.links.instagram)}" target="_blank" rel="noopener noreferrer">${esc(SITE.instagramHandle)}</a></p>
<p class="fine">Imagens ilustrativas.</p>
</footer>
<dialog id="sheet" aria-labelledby="s-name">
<div class="sheet">
<span class="grab" aria-hidden="true"></span>
<button class="close" type="button">Fechar</button>
<div class="sp" id="s-ph"><img id="s-img" src="" alt=""></div>
<div class="body">
<div class="meta"><span class="grp" id="s-group"></span><span class="pos" id="s-pos"></span></div>
<h4 id="s-name"></h4>
<p class="d" id="s-desc"></p>
<p class="n" id="s-note"></p>
<p class="swipe">Deslize a foto para o lado para ver o próximo prato</p>
</div>
</div>
</dialog>
<script>
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // miniaturas aparecem quando terminam de carregar (sem quadrado vazio piscando)
  [].forEach.call(document.querySelectorAll(".ph img"), function (img) {
    var ok = function () { img.classList.add("ok"); };
    if (img.complete && img.naturalWidth) ok();
    else { img.addEventListener("load", ok); img.addEventListener("error", ok); }
  });

  // cozinha atual: o destaque vermelho do seletor desliza até ela
  var cats = [].slice.call(document.querySelectorAll(".cat"));
  var tabs = [].slice.call(document.querySelectorAll(".seg a"));
  var ind = document.querySelector(".seg .ind");
  var cur = -1, lock = 0, ticking = false;
  function mark(i) {
    if (i === cur) return;
    cur = i;
    ind.style.transform = "translateX(" + i * 100 + "%)";
    tabs.forEach(function (t, j) { t.setAttribute("aria-current", String(j === i)); });
  }
  function spy() {
    ticking = false;
    if (Date.now() < lock) return;
    var line = window.innerHeight * 0.35, found = 0;
    cats.forEach(function (c, i) { if (c.getBoundingClientRect().top <= line) found = i; });
    mark(found);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function (e) {
      e.preventDefault();
      mark(i);
      lock = Date.now() + (reduce ? 0 : 1200);
      cats[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  // folha do prato
  var dlg = document.getElementById("sheet");
  if (!dlg.showModal) return;
  var sheet = dlg.querySelector(".sheet"), ph = document.getElementById("s-ph"), img = document.getElementById("s-img");
  var el = { group: document.getElementById("s-group"), pos: document.getElementById("s-pos"), name: document.getElementById("s-name"), desc: document.getElementById("s-desc"), note: document.getElementById("s-note") };
  var list = [], idx = 0;
  function fill(b) {
    img.src = b.dataset.img; img.alt = b.dataset.name;
    el.group.textContent = b.dataset.group;
    el.pos.textContent = idx + 1 + " de " + list.length;
    el.name.textContent = b.dataset.name;
    el.desc.textContent = b.dataset.desc; el.desc.hidden = !b.dataset.desc;
    el.note.textContent = b.dataset.note; el.note.hidden = !b.dataset.note;
  }
  function open(b) {
    list = [].slice.call(document.querySelectorAll('.dish[data-cat="' + b.dataset.cat + '"]'));
    idx = list.indexOf(b);
    fill(b);
    dlg.showModal();
    sheet.scrollTop = 0;
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add("on"); }); });
  }
  function shut() {
    if (!dlg.open) return;
    dlg.classList.remove("on");
    dlg.style.transform = "";
    setTimeout(function () { dlg.close(); }, reduce ? 0 : 420);
  }
  function go(step) {
    var next = idx + step;
    if (next < 0 || next >= list.length) return;
    idx = next;
    if (reduce) return fill(list[idx]);
    ph.classList.add(step > 0 ? "out-l" : "out-r");
    setTimeout(function () {
      fill(list[idx]);
      ph.classList.remove("out-l", "out-r");
      ph.classList.add(step > 0 ? "out-r" : "out-l");
      requestAnimationFrame(function () { requestAnimationFrame(function () { ph.classList.remove("out-l", "out-r"); }); });
    }, 170);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".dish");
    if (t) open(t);
  });
  dlg.querySelector(".close").addEventListener("click", shut);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) shut(); });
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); shut(); });
  document.addEventListener("keydown", function (e) {
    if (!dlg.open) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });

  // gestos: foto para o lado = próximo/anterior; puxar a folha para baixo = fechar
  var sx = 0, sy = 0, axis = "", dy = 0;
  dlg.addEventListener("touchstart", function (e) { var p = e.touches[0]; sx = p.clientX; sy = p.clientY; axis = ""; dy = 0; }, { passive: true });
  dlg.addEventListener("touchmove", function (e) {
    var p = e.touches[0], mx = p.clientX - sx, my = p.clientY - sy;
    if (!axis && (Math.abs(mx) > 8 || Math.abs(my) > 8)) axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    if (axis === "y" && my > 0 && sheet.scrollTop <= 0) { dy = my; dlg.style.transition = "none"; dlg.style.transform = "translateY(" + my + "px)"; }
  }, { passive: true });
  dlg.addEventListener("touchend", function (e) {
    var mx = e.changedTouches[0].clientX - sx;
    dlg.style.transition = "";
    if (axis === "x" && Math.abs(mx) > 50 && ph.contains(e.target)) go(mx < 0 ? 1 : -1);
    if (axis === "y") { if (dy > 110) shut(); else dlg.style.transform = ""; }
  });
})();
</script>
</body>
</html>
`;

await writeFile(path.join(dist, "cardapio.html"), html);
// o cardápio entra no mapa do site (feito pelo finalize-dist)
const sitemap = path.join(dist, "sitemap.xml");
const sm = await readFile(sitemap, "utf8").catch(() => "");
if (sm && !sm.includes("/cardapio<")) await writeFile(sitemap, sm.replace("</urlset>", `  <url><loc>${site}cardapio</loc></url>\n</urlset>`));
const total = MENU.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.items.length, 0), 0);
console.log(`✓ dist/cardapio.html pronto — ${total} pratos, sem preços`);
