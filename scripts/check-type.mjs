// Verifica se algum título display estoura a própria coluna (palavra longa > largura), em várias larguras.
import { chromium } from "playwright";
const URL = process.argv[2] || "http://localhost:5173/";
const widths = [320, 340, 360, 375, 390, 412, 430, 500, 640, 700, 768, 900, 1000, 1024, 1100, 1180, 1200, 1280, 1366, 1440, 1600, 1920, 2560];
const b = await chromium.launch({ channel: "msedge" });
const p = await b.newPage();
await p.goto(URL, { waitUntil: "load" });
await p.waitForTimeout(1500);
let bad = 0;
for (const w of widths) {
  await p.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
  await p.waitForTimeout(250);
  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll(".display, h2 > span, h3").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "inline") return;
      const over = el.scrollWidth - el.clientWidth;
      if (over > 1) out.push(`${el.textContent.trim().slice(0, 28)} (+${over}px)`);
    });
    return out;
  });
  if (r.length) { bad++; console.log(w, r.join(" | ")); }
}
console.log(bad ? `${bad} larguras com estouro` : "nenhum título estoura a coluna");
await b.close();
