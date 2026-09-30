/**
 * QA automatizado (Playwright): percorre o site em vários navegadores e larguras,
 * tira screenshots da intro em pontos de progresso e de cada seção,
 * e verifica erros de console, overflow horizontal e o sincronismo scroll → vídeo.
 *
 * Uso: node scripts/qa.mjs [--url http://localhost:5173] [--browsers edge,chrome,firefox,webkit] [--vps 390x844,1440x900] [--out ../_qa] [--reduced]
 */
import { chromium, firefox, webkit } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const URL = arg("url", "http://localhost:5173/");
const OUT = path.resolve(arg("out", "qa-output"));
const REDUCED = process.argv.includes("--reduced");
const SHOTS = !process.argv.includes("--no-shots");
const BROWSERS = arg("browsers", "edge").split(",");
const VPS = arg("vps", "320x568,360x640,375x667,390x844,412x915,430x932,768x1024,1024x768,1280x800,1366x768,1440x900,1920x1080,844x390")
  .split(",")
  .map((s) => s.split("x").map(Number));

const launchers = {
  edge: () => chromium.launch({ channel: "msedge" }),
  chrome: () => chromium.launch({ channel: "chrome" }),
  chromium: () => chromium.launch(),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Intro (HeroIntro): papel rasga até 55%; a marca entra entre 20% e 80% — opacidade média esperada.
function expectedBrand(p) {
  return p <= 0.2 ? 0 : p >= 0.8 ? 1 : null; // no meio, varia item a item
}
const report = [];

for (const b of BROWSERS) {
  const browser = await launchers[b]();
  for (const [w, h] of VPS) {
    const phone = w < 768 || h < 500;
    const ctxOpts = { viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, reducedMotion: REDUCED ? "reduce" : "no-preference" };
    if (phone && b !== "firefox") Object.assign(ctxOpts, { isMobile: true, hasTouch: true });
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const tag = `${b}-${w}x${h}${REDUCED ? "-reduced" : ""}`;
    const dir = path.join(OUT, b);
    await mkdir(dir, { recursive: true });

    await page.goto(URL, { waitUntil: "load" });
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    await sleep(600);
    const info = await page.evaluate(() => ({ burger: !!document.querySelector("#inicio video, .hero-box") }));

    const hero = await page.evaluate(() => {
      const s = document.getElementById("inicio");
      return { max: s.offsetHeight - window.innerHeight, top: s.offsetTop };
    });

    const sync = [];
    const heroPoints = REDUCED ? [0] : [0, 0.45, 0.86, 1, 0.3];
    for (const p of heroPoints) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(hero.max * p));
      await sleep(1300);
      const o = await page.evaluate(() => { const els = [...document.querySelectorAll("[data-brand]")]; return els.reduce((a, e) => a + (getComputedStyle(e).visibility === "visible" ? +getComputedStyle(e).opacity : 0), 0) / els.length; });
      sync.push({ p, marca: +o.toFixed(2), esperado: expectedBrand(p) });
      if (SHOTS) await page.screenshot({ path: path.join(dir, `${tag}-hero-${String(Math.round(p * 100)).padStart(3, "0")}.png`) });
    }

    // Percorre a página inteira (dispara reveals) e fotografa cada seção.
    const sections = ["cardapio", "cardapio-palco", "ambiente", "atendimento", "delivery", "localizacao"];
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = hero.max; y < total; y += Math.round(h * 0.6)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await sleep(120);
    }
    await sleep(800);
    for (const id of sections) {
      await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: "start" }), id);
      await sleep(900);
      if (SHOTS) await page.screenshot({ path: path.join(dir, `${tag}-${id}.png`) });
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(900);
    if (SHOTS) await page.screenshot({ path: path.join(dir, `${tag}-footer.png`) });

    const layout = await page.evaluate(() => {
      const de = document.documentElement;
      const wide = [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" || el.closest("[aria-hidden='true']") || el.closest(".hero-stage") || el.closest(".marquee-track")) return false;
          return r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1);
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}.${String(el.className).slice(0, 50)}`);
      const hidden = [...document.querySelectorAll("[data-reveal],[data-brand]")]
        .filter((el) => getComputedStyle(el).visibility === "hidden" || +getComputedStyle(el).opacity < 0.5)
        .map((el) => `${el.closest("section")?.id || "?"}:${el.textContent.trim().slice(0, 24)} (op ${getComputedStyle(el).opacity})`);
      return { overflowX: de.scrollWidth - de.clientWidth, wide, stillHidden: hidden };
    });

    const row = { tag, ...info, sync, ...layout, errors };
    report.push(row);
    console.log(JSON.stringify(row));
    await ctx.close();
  }
  await browser.close();
}

await writeFile(path.join(OUT, `report${REDUCED ? "-reduced" : ""}.json`), JSON.stringify(report, null, 2));
