// Fotos dos produtos do cardápio → public/assets/cardapio/<categoria>/
//   <slug>.webp        foto do palco (textura da MorphGallery): até 1200 px
//   <slug>-thumb.webp  miniatura da lista (200 px)
//   tex/<cat>--<slug>.js  a mesma foto do palco como data URI, para o WebGL funcionar
//                          quando o site é aberto direto do disco (file://), onde
//                          imagens locais não podem virar textura.
//
// Fonte: source-assets/cardapio-hd/<cat>/<slug>.(png|jpg|webp) se existir (versão melhorada),
// senão source-assets/cardapio/<cat>/<slug>.webp (original do anota.ai, 600 px).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "source-assets", "cardapio");
const hd = path.join(root, "source-assets", "cardapio-hd");
const out = path.join(root, "public", "assets", "cardapio");
const catalog = JSON.parse(await fs.readFile(path.join(src, "catalogo.json"), "utf8"));

async function pickSource(cat, slug) {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const p = path.join(hd, cat, `${slug}.${ext}`);
    try {
      await fs.access(p);
      return { file: p, hd: true };
    } catch {}
  }
  return { file: path.join(src, cat, `${slug}.webp`), hd: false };
}

await fs.mkdir(path.join(out, "tex"), { recursive: true });
let n = 0;
let hdCount = 0;
for (const cat of ["burger", "pizza", "grill"]) {
  await fs.mkdir(path.join(out, cat), { recursive: true });
  for (const { slug } of catalog[cat]) {
    const { file, hd: isHd } = await pickSource(cat, slug);
    // libvips com caminhos longos no Windows: lê e grava por buffer
    const input = await fs.readFile(file);
    const size = isHd ? 1200 : 600;
    const stage = await sharp(input)
      .resize(size, size, { fit: "cover", position: "centre", kernel: "lanczos3" })
      // realce leve de nitidez: as fotos do anota.ai chegam um pouco macias
      .sharpen({ sigma: isHd ? 0.5 : 0.8, m1: 0.6, m2: 2 })
      .webp({ quality: isHd ? 80 : 84, effort: 6 })
      .toBuffer();
    const thumb = await sharp(input).resize(200, 200, { fit: "cover" }).sharpen({ sigma: 0.6 }).webp({ quality: 78, effort: 6 }).toBuffer();
    await fs.writeFile(path.join(out, cat, `${slug}.webp`), stage);
    await fs.writeFile(path.join(out, cat, `${slug}-thumb.webp`), thumb);
    const key = `${cat}/${slug}`;
    const js = `window.__vvTex&&window.__vvTex(${JSON.stringify(key)},"data:image/webp;base64,${stage.toString("base64")}");\n`;
    await fs.writeFile(path.join(out, "tex", `${cat}--${slug}.js`), js);
    n++;
    if (isHd) hdCount++;
  }
}
console.log(`${n} fotos do cardápio geradas (${hdCount} em alta resolução)`);
