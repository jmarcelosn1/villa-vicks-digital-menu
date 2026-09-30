// Baixa as fotos dos produtos do anota.ai (versão _600, a maior que o anota.ai serve)
// para source-assets/cardapio/<categoria>/<slug>.<ext>. Só baixa o que ainda não existe.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "source-assets", "cardapio");
const catalog = JSON.parse(await fs.readFile(path.join(dir, "catalogo.json"), "utf8"));

const variants = (src) => [src.replace(/blob\.webp$/, "blob_600.webp"), src];

let ok = 0;
for (const cat of ["burger", "pizza", "grill"]) {
  await fs.mkdir(path.join(dir, cat), { recursive: true });
  for (const item of catalog[cat]) {
    const existing = (await fs.readdir(path.join(dir, cat))).find((f) => f.startsWith(item.slug + "."));
    if (existing) {
      ok++;
      continue;
    }
    let saved = false;
    for (const url of variants(item.src)) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      await fs.writeFile(path.join(dir, cat, `${item.slug}.${meta.format}`), buf);
      console.log(`${cat}/${item.slug}: ${meta.width}x${meta.height} ${meta.format} ${(buf.length / 1024).toFixed(0)} KB`);
      saved = true;
      ok++;
      break;
    }
    if (!saved) console.error(`FALHOU ${cat}/${item.slug}`);
  }
}
console.log(`${ok} fotos prontas`);
