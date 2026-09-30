// Mapa estático da localização (OpenStreetMap, escurecido aqui no tom do site), no lugar do Google Maps
// embutido: carrega na hora, funciona sem internet e combina com o site. O pino é desenhado no HTML.
// Uso: node scripts/build-map.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const LAT = -3.39034;
const LON = -44.3648791;
const Z = 17;
const TILE = 256;
const OUT = "public/assets/mapa";

const n = 2 ** Z;
const fx = ((LON + 180) / 360) * n;
const fy = ((1 - Math.log(Math.tan((LAT * Math.PI) / 180) + 1 / Math.cos((LAT * Math.PI) / 180)) / Math.PI) / 2) * n;
const cx = Math.floor(fx);
const cy = Math.floor(fy);
const R = 3; // 7×7 tiles
const CACHE = "source-assets/mapa-tiles";
mkdirSync(CACHE, { recursive: true });
const tiles = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let dy = -R; dy <= R; dy++) {
  for (let dx = -R; dx <= R; dx++) {
    const x = cx + dx;
    const y = cy + dy;
    const url = `https://tile.openstreetmap.org/${Z}/${x}/${y}.png`;
    const cache = `${CACHE}/${Z}-${x}-${y}.png`;
    if (!existsSync(cache)) {
      await sleep(120); // educado com o servidor do OSM
      const res = await fetch(url, { headers: { "User-Agent": "villa-vicks-site-build/1.0 (mapa estatico unico)" } });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
    }
    tiles.push({ input: readFileSync(cache), left: (dx + R) * TILE, top: (dy + R) * TILE });
  }
}
const size = (2 * R + 1) * TILE;
const big = await sharp({ create: { width: size, height: size, channels: 3, background: "#0e0e0e" } }).composite(tiles).png().toBuffer();
// ponto do restaurante dentro do mosaico
const px = Math.round((fx - cx + R) * TILE);
const py = Math.round((fy - cy + R) * TILE);

mkdirSync(OUT, { recursive: true });

// Cores do OSM → cores do site: terreno quase preto, ruas marrom claro, rodovias no vermelho da marca,
// água azul bem escuro, textos (escuros no OSM) claros. Entre os tons, interpola pela luminância.
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(Math.max(t, 0), 1)));
const LAND = [20, 16, 15];
const ROAD = [92, 76, 68];
const MAJOR = [150, 34, 30];
const WATER = [14, 20, 25];
const TEXT = [206, 190, 178];
function recolor(r, g, b) {
  const L = 0.299 * r + 0.587 * g + 0.114 * b;
  if (L < 140) return mix(TEXT, LAND, (L - 40) / 100); // texto e ícones
  if (b > r + 18 && b > g - 4) return mix(WATER, LAND, (r - 150) / 80); // rio
  if (r - b > 40 && r > 200) return mix(LAND, MAJOR, (r - b - 20) / 60); // BR, avenidas (laranja/rosa no OSM)
  return mix(LAND, ROAD, (L - 238) / 14); // terreno (~240) → rua (255)
}
// [largura, altura, altura do pino]: no celular o cartão cobre a parte de baixo, então o pino fica mais alto
const crops = { retrato: [900, 1250, 0.3], paisagem: [1600, 1040, 0.44] };
const info = {};
for (const [name, [w, h, at]] of Object.entries(crops)) {
  const left = Math.max(0, Math.min(size - w, px - Math.round(w / 2)));
  const top = Math.max(0, Math.min(size - h, py - Math.round(h * at)));
  const { data, info: meta } = await sharp(big).extract({ left, top, width: w, height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(meta.width * meta.height * 3);
  for (let k = 0; k < data.length; k += 3) out.set(recolor(data[k], data[k + 1], data[k + 2]), k);
  await sharp(out, { raw: { width: meta.width, height: meta.height, channels: 3 } }).webp({ quality: 74, effort: 6 }).toFile(`${OUT}/mapa-${name}.webp`);
  info[name] = { w, h, pinX: +((px - left) / w).toFixed(4), pinY: +((py - top) / h).toFixed(4) };
}
writeFileSync(`${OUT}/info.json`, JSON.stringify(info, null, 1));
console.log(info);
