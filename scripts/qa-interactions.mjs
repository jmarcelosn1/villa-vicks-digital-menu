/**
 * QA de interações: menu mobile (toque), links, fallback de vídeo, reduced motion,
 * rotação de tela, scroll rápido e checagens básicas de acessibilidade.
 * Uso: node scripts/qa-interactions.mjs [--url http://localhost:5173/] [--browser edge|chrome|firefox|webkit]
 */
import { chromium, firefox, webkit } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const URL = arg("url", "http://localhost:5173/");
const B = arg("browser", "edge");
const OUT = path.resolve("qa-output/interactions");
await mkdir(OUT, { recursive: true });

const launch = { edge: () => chromium.launch({ channel: "msedge" }), chrome: () => chromium.launch({ channel: "chrome" }), firefox: () => firefox.launch(), webkit: () => webkit.launch() }[B];
const browser = await launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const mobile = B === "firefox" ? {} : { isMobile: true, hasTouch: true };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ...mobile, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return { ctx, page, errors };
}

/* 1. Menu mobile via toque ----------------------------------------- */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForSelector("#cardapio", { state: "attached", timeout: 15000 });
  await sleep(800);
  // o menu só aparece depois da intro: desce até o cardápio primeiro
  await page.evaluate(() => document.getElementById("cardapio").scrollIntoView({ behavior: "instant" }));
  await sleep(700);
  const trigger = page.getByRole("button", { name: "Abrir menu" });
  check("menu: botão hamburger visível", await trigger.isVisible());
  const box = await trigger.boundingBox();
  check("menu: alvo de toque ≥ 44px", box && box.width >= 44 && box.height >= 44, `${box?.width}x${box?.height}`);
  check("menu: aria-expanded=false fechado", (await trigger.getAttribute("aria-expanded")) === "false");
  if (B === "firefox") await trigger.click();
  else await trigger.tap();
  await sleep(700);
  const dialog = page.getByRole("dialog");
  check("menu: abre (role=dialog)", await dialog.isVisible());
  await page.screenshot({ path: path.join(OUT, `${B}-menu-open.png`) });
  const pizzaLink = dialog.getByRole("link", { name: "Pizza" });
  if (B === "firefox") await pizzaLink.click();
  else await pizzaLink.tap();
  // espera o resultado (animação de fechar + rolagem suave), com limite: o WebKit de teste é lento
  await page
    .waitForFunction(() => !document.querySelector("[role=dialog]") && Math.abs(document.getElementById("cardapio-palco").getBoundingClientRect().top - 80) < 60, null, { timeout: 4000, polling: 100 })
    .catch(() => {});
  const nav = await page.evaluate(() => ({
    top: document.getElementById("cardapio-palco").getBoundingClientRect().top,
    pizza: [...document.querySelectorAll("#cardapio-palco [role=group] button")].find((b) => b.textContent === "Pizza")?.getAttribute("aria-pressed"),
  }));
  check("menu: fecha e abre a aba Pizza no cardápio", !(await dialog.isVisible()) && Math.abs(nav.top - 80) < 60 && nav.pizza === "true", JSON.stringify(nav));
  // Esc fecha
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await sleep(500);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  check("menu: Esc fecha", !(await page.getByRole("dialog").isVisible()));
  check("menu: sem erros de console", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* 2. Links, alt, headings ------------------------------------------- */
{
  const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: "load" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  await sleep(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  await sleep(800);
  const audit = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), text: (a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " "), target: a.target, rel: a.rel }));
    const brokenAnchors = links.filter((l) => l.href?.startsWith("#") && l.href.length > 1 && !document.getElementById(l.href.slice(1)));
    const extNoRel = links.filter((l) => l.target === "_blank" && !/noopener/.test(l.rel));
    const emptyText = links.filter((l) => !l.text);
    const imgsNoAlt = [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.src);
    const h1 = document.querySelectorAll("h1").length;
    const externals = [...new Set(links.filter((l) => /^https?:/.test(l.href)).map((l) => l.href))];
    const prices = /R\$\s?\d/.test(document.body.innerText);
    return { total: links.length, brokenAnchors, extNoRel, emptyText, imgsNoAlt, h1, externals, prices };
  });
  check("links: âncoras internas existem", audit.brokenAnchors.length === 0, JSON.stringify(audit.brokenAnchors));
  check("links: externos com rel=noopener", audit.extNoRel.length === 0);
  check("links: todos com texto/aria-label", audit.emptyText.length === 0, JSON.stringify(audit.emptyText));
  check("imagens: todas com atributo alt", audit.imgsNoAlt.length === 0, audit.imgsNoAlt.join(","));
  check("semântica: exatamente um h1", audit.h1 === 1, String(audit.h1));
  check("conteúdo: nenhum preço (R$) na interface", !audit.prices);
  console.log("links externos:\n  " + audit.externals.join("\n  "));
  // Navegação por teclado: o primeiro Tab mostra o skip link
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  // Safari só foca links com Option+Tab (comportamento padrão do navegador).
  await page.keyboard.press(B === "webkit" ? "Alt+Tab" : "Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("teclado: skip link é o primeiro foco", focused === "Pular para o conteúdo", focused);
  await ctx.close();
}

/* 3. Intro sem hambúrguer: nada de vídeo/fotos do burger, e a marca aparece no fim ---------- */
{
  const { ctx, page, errors } = await newPage();
  const burgerReqs = [];
  page.on("request", (r) => /\/assets\/videos\/|\.mp4|\.webm/.test(r.url()) && burgerReqs.push(r.url()));
  await page.goto(URL, { waitUntil: "load" });
  await sleep(800);
  const state = await page.evaluate(() => ({ video: !!document.querySelector("#inicio video"), imgs: document.querySelectorAll("#inicio img:not([alt=''])").length, box: !!document.querySelector(".hero-box") }));
  check("intro: sem hambúrguer (vídeo/foto/caixa)", !state.video && !state.box && state.imgs === 0 && burgerReqs.length === 0, JSON.stringify({ ...state, requisicoes: burgerReqs.length }));
  const max = await page.evaluate(() => document.getElementById("inicio").offsetHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), max);
  await page
    .waitForFunction(() => [...document.querySelectorAll("[data-brand]")].every((e) => getComputedStyle(e).visibility === "visible" && +getComputedStyle(e).opacity > 0.95), null, { timeout: 4000, polling: 100 })
    .catch(() => {});
  const brandVisible = await page.evaluate(() => [...document.querySelectorAll("[data-brand]")].every((e) => getComputedStyle(e).visibility === "visible"));
  check("intro: identidade revelada no fim", brandVisible);
  await page.screenshot({ path: path.join(OUT, `${B}-intro-end.png`) });
  check("intro: sem exceções JS", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* 4. Reduced motion --------------------------------------------------- */
{
  const { ctx, page } = await newPage({ reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "load" });
  await sleep(1200);
  const s = await page.evaluate(() => ({
    video: !!document.querySelector("video"),
    trackH: document.getElementById("inicio").offsetHeight,
    vh: innerHeight,
    brand: [...document.querySelectorAll("[data-brand]")].every((e) => getComputedStyle(e).visibility === "visible"),
  }));
  check("reduced motion: sem scrub de vídeo e intro de 1 tela", !s.video && s.trackH <= s.vh + 2, JSON.stringify(s));
  check("reduced motion: identidade visível imediatamente", s.brand);
  await page.screenshot({ path: path.join(OUT, `${B}-reduced-hero.png`) });
  await page.waitForSelector("#cardapio", { timeout: 15000 });
  await page.evaluate(() => document.getElementById("cardapio").scrollIntoView());
  await sleep(400);
  const vis = await page.evaluate(() => [...document.querySelectorAll("#cardapio [data-reveal]")].every((e) => getComputedStyle(e).opacity === "1"));
  check("reduced motion: conteúdo visível sem animação", vis);
  await ctx.close();
}

/* 4b. Abre sempre no início (mesmo com #âncora na URL) + navegação e scroll muito rápido ---------- */
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 1366, height: 768 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
  await page.goto(URL + "#localizacao", { waitUntil: "load" });
  await page.waitForSelector("#localizacao");
  await sleep(1500);
  const start = await page.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash }));
  check("abertura: começa no topo mesmo com #localizacao na URL", start.y < 5 && start.hash === "", JSON.stringify(start));
  const hiddenInView = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-reveal],[data-reveal-clip]")]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
        .filter((el) => getComputedStyle(el).visibility === "hidden" || +getComputedStyle(el).opacity < 0.9).length,
    );
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  // salto longo, como um clique no menu
  await page.evaluate(() => document.getElementById("localizacao").scrollIntoView());
  await sleep(2000);
  check("salto para #localizacao: conteúdo visível", (await hiddenInView()) === 0);
  await page.evaluate(() => document.getElementById("cardapio-palco").scrollIntoView());
  await sleep(2000);
  check("volta para o cardápio: conteúdo visível", (await hiddenInView()) === 0);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 900) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 16));
    }
  });
  await sleep(2200);
  const left = await page.evaluate(() => [...document.querySelectorAll("[data-reveal],[data-reveal-clip]")].filter((el) => getComputedStyle(el).visibility === "hidden" || +getComputedStyle(el).opacity < 0.9).map((el) => el.textContent.trim().slice(0, 20)));
  check("scroll muito rápido: nada fica invisível", left.length === 0, left.join(" | "));
  check("abertura/scroll rápido: sem erros", errors.filter((e) => !/google|maps|Permission policy/i.test(e)).length === 0, errors.join(" | "));
  await ctx.close();
}

/* 5. Rotação + scroll rápido ----------------------------------------- */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(URL, { waitUntil: "load" });
  await sleep(800);
  // opacidade média da marca (0 = escondida, 1 = inteira)
  const brandOpacity = () => page.evaluate(() => { const els = [...document.querySelectorAll("[data-brand]")]; return els.reduce((a, e) => a + (getComputedStyle(e).visibility === "visible" ? +getComputedStyle(e).opacity : 0), 0) / els.length; });
  // scroll rápido até o fim da intro e volta ao topo
  const max = await page.evaluate(() => document.getElementById("inicio").offsetHeight - innerHeight);
  for (let i = 0; i <= 10; i++) await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round((max * i) / 10));
  await sleep(1500);
  const oEnd = await brandOpacity();
  for (let i = 10; i >= 0; i--) await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round((max * i) / 10));
  await sleep(1500);
  const oStart = await brandOpacity();
  check("scroll rápido: marca inteira no fim da intro", oEnd > 0.95, oEnd.toFixed(2));
  check("scroll rápido de volta: marca escondida no topo (papel inteiro)", oStart < 0.05, oStart.toFixed(2));
  // rotação para paisagem no meio da revelação
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), max);
  await sleep(1200);
  await page.setViewportSize({ width: 844, height: 390 });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, `${B}-rotated-landscape.png`) });
  const geo = await page.evaluate(() => {
    const logo = document.querySelector("[data-brand]").getBoundingClientRect();
    return { logoCentro: Math.round(logo.left + logo.width / 2), meiaTela: innerWidth / 2, logoBase: Math.round(logo.bottom), tela: innerHeight, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  check("rotação: marca centralizada, na tela e sem overflow", geo.overflowX === 0 && Math.abs(geo.logoCentro - geo.meiaTela) < 4 && geo.logoBase < geo.tela, JSON.stringify(geo));
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, `${B}-rotated-back.png`) });
  check("rotação/scroll: sem erros de console", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passaram (${B})`);
process.exit(failed.length ? 1 : 0);
