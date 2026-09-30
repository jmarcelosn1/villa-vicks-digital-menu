// Monta uma folha de contato com screenshots (para revisão visual rápida).
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const [out, colsArg, widthArg, ...files] = process.argv.slice(2);
const cols = +colsArg, tileW = +widthArg;
const tiles = await Promise.all(files.map(async (f) => {
  const img = sharp(await readFile(f)).resize({ width: tileW });
  const buf = await img.toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, h: m.height };
}));
const rows = Math.ceil(tiles.length / cols);
const rowH = [];
for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h)));
const W = cols * tileW + (cols + 1) * 8, H = rowH.reduce((a, b) => a + b, 0) + (rows + 1) * 8;
let y = 8; const comp = [];
for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { const t = tiles[r * cols + c]; if (t) comp.push({ input: t.buf, left: 8 + c * (tileW + 8), top: y }); } y += rowH[r] + 8; }
await writeFile(out, await sharp({ create: { width: W, height: H, channels: 3, background: "#ff00ff" } }).composite(comp).jpeg({ quality: 82 }).toBuffer());
