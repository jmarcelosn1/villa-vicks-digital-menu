/**
 * Villa Vick's — pipeline de assets.
 *
 * 1. Copia TODOS os arquivos originais (sem alterar) para /source-assets/<categoria>/
 * 2. Gera versões otimizadas (AVIF + WebP + JPG, com srcset) em /public/assets/<categoria>/
 * 3. Reencoda o vídeo da intro com keyframes frequentes (scrub suave para frente e para trás)
 * 4. Gera logo com transparência, favicons e imagem Open Graph
 * 5. Escreve src/data/assets.generated.ts com dimensões e srcsets (evita CLS)
 *
 * Uso: npm run assets            (pula o que já existe)
 *      npm run assets -- --force (refaz tudo)
 */
import { copyFile, mkdir, writeFile, readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INBOX = path.resolve(ROOT, "_import");
const ZIP_DIR = path.join(INBOX, "zip/villa_vicks_imagens");
const VIDEO_ORIGINAL = "Burger_ingredients_assembling_1080p_20260925134813.mp4";
const ORIGINALS = path.join(ROOT, "source-assets");
const original = (e) => path.join(ORIGINALS, e.cat, e.file);
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(PUBLIC, "assets");
const FORCE = process.argv.includes("--force");

const exists = (p) => access(p).then(() => true, () => false);

// libvips não suporta caminhos > 260 caracteres no Windows: toda E/S passa por buffers do Node.
const load = (p) => readFile(p).then((b) => sharp(b));
const save = async (img, p) => writeFile(p, await img.toBuffer());

/**
 * Catálogo de todos os arquivos recebidos, com categoria definida pela análise visual.
 * crop: recorte em pixels do original (remove textos "chapados" de arte de Instagram
 *       e setas de carrossel nas bordas). Os originais continuam intactos em /source-assets.
 */
const CATALOG = [
  // branding
  { file: "logo-villa-vicks.jpg", from: INBOX, cat: "branding", kind: "logo" },
  { file: "07_prompt_poster.png", cat: "branding", note: "Referência do prompt usado para gerar as imagens de estúdio — não exibida no site" },

  // burger — estúdio (alta resolução)
  { file: "01_cheeseburger_gourmet.png", cat: "burger" },
  { file: "02_hamburguer_camadas.png", cat: "burger" },
  { file: "03_hamburguer_desconstruido.png", cat: "burger" },
  { file: "04_hamburguer_scroll_aberto.png", cat: "burger" },
  { file: "05_hamburguer_sem_picles.png", cat: "burger" },
  { file: "06_hamburguer_fechado_aberto.png", cat: "burger" },
  // burger — fotos reais Vick's
  { file: "08_vicks_burger_01.png", cat: "burger" },
  { file: "10_vicks_burger_02.png", cat: "burger" },
  { file: "11_vicks_burger_bebida.png", cat: "burger" },
  { file: "18_vicks_burger_artesanal.png", cat: "burger", crop: { left: 0, top: 64, width: 315, height: 260 } },
  { file: "19_vicks_burger_03.png", cat: "burger" },

  // pizza
  { file: "09_vicks_pizza_01.png", cat: "pizza" },
  { file: "13_vicks_pizza_02.png", cat: "pizza" },
  { file: "14_pizza_portuguesa.png", cat: "pizza", crop: { left: 0, top: 118, width: 312, height: 227 } },
  { file: "15_pizza_moda_vicks.png", cat: "pizza", crop: { left: 0, top: 132, width: 313, height: 223 } },
  { file: "16_pizza_slice.png", cat: "pizza" },
  { file: "17_pizza_nordestina.png", cat: "pizza", crop: { left: 0, top: 150, width: 317, height: 232 } },

  // grill
  { file: "12_vicks_grill_01.png", cat: "grill" },
  { file: "20_vicks_grill_02.png", cat: "grill" },
  { file: "25_grill_03.png", cat: "grill" },

  // delivery / ambiente / atendimento / bebidas
  { file: "21_delivery.png", cat: "delivery" },
  { file: "22_ambiente.png", cat: "environment", crop: { left: 0, top: 0, width: 411, height: 250 }, backdrop: true },
  { file: "23_atendimento.png", cat: "environment", crop: { left: 12, top: 0, width: 340, height: 386 } },
  { file: "24_bebida.png", cat: "drinks" },
];

const slug = (file) => path.parse(file).name.replace(/_/g, "-");

function widthsFor(w) {
  // Fotos grandes de estúdio: tamanhos responsivos. Fotos reais pequenas: 1x nativo + 2x (lanczos) para telas retina.
  if (w >= 1000) return [480, 800, 1200].filter((x) => x < w).concat(Math.min(w, 1600));
  return [w, Math.min(w * 2, 900)];
}

async function encodeImage(entry) {
  const src = original(entry);
  const outDir = path.join(OUT, entry.cat);
  await mkdir(outDir, { recursive: true });
  const base = (await load(src)).rotate();
  const pipeline = entry.crop ? base.extract(entry.crop) : base;
  const buf = await pipeline.toBuffer();
  const meta = await sharp(buf).metadata();
  const name = slug(entry.file);
  const widths = widthsFor(meta.width);
  const variants = [];
  for (const w of widths) {
    const upscale = w > meta.width;
    const make = () => {
      let s = sharp(buf).resize({ width: w, kernel: "lanczos3" });
      if (upscale) s = s.sharpen({ sigma: 0.6 });
      return s;
    };
    const h = Math.round((meta.height * w) / meta.width);
    const file = (ext) => path.join(outDir, `${name}-${w}.${ext}`);
    if (FORCE || !(await exists(file("webp")))) {
      await save(make().avif({ quality: 55, effort: 5 }), file("avif"));
      await save(make().webp({ quality: 78 }), file("webp"));
      await save(make().jpeg({ quality: 80, mozjpeg: true }), file("jpg"));
    }
    variants.push({ w, h });
  }
  if (entry.backdrop) {
    // Versão já desfocada para fundos (evita filter: blur em runtime).
    const bd = path.join(outDir, `${name}-backdrop.webp`);
    if (FORCE || !(await exists(bd))) {
      await save(sharp(buf).resize({ width: 480 }).blur(14).modulate({ brightness: 0.8, saturation: 1.15 }).webp({ quality: 70 }), bd);
    }
  }
  const url = (w, ext) => `/assets/${entry.cat}/${name}-${w}.${ext}`;
  const largest = variants[variants.length - 1];
  return {
    key: name,
    category: entry.cat,
    width: meta.width,
    height: meta.height,
    avif: variants.map((v) => `${url(v.w, "avif")} ${v.w}w`).join(", "),
    webp: variants.map((v) => `${url(v.w, "webp")} ${v.w}w`).join(", "),
    src: url(largest.w === meta.width ? largest.w : variants[0].w, "jpg"),
  };
}

async function buildLogo() {
  const src = path.join(ORIGINALS, "branding", "logo-villa-vicks.jpg");
  const outDir = path.join(OUT, "branding");
  await mkdir(outDir, { recursive: true });
  const { data, info } = await (await load(src)).raw().toBuffer({ resolveWithObject: true });
  // Converte fundo preto em transparência: alpha a partir do canal mais forte, com des-premultiplicação.
  const rgba = Buffer.alloc(info.width * info.height * 4);
  const smooth = (e0, e1, x) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = smooth(18, 150, Math.max(r, g, b));
    // c/a: sobre fundo preto o resultado composto é idêntico ao original.
    const un = (c) => (a > 0 ? Math.min(255, Math.round(c / a)) : 0);
    rgba[j] = un(r); rgba[j + 1] = un(g); rgba[j + 2] = un(b); rgba[j + 3] = Math.round(a * 255);
  }
  const trimmed = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: 110, top: 260, width: 1760, height: 1060 })
    .png()
    .toBuffer();
  for (const w of [320, 640, 1200]) {
    await save(sharp(trimmed).resize({ width: w }).webp({ quality: 90, alphaQuality: 90 }), path.join(outDir, `logo-${w}.webp`));
    await save(sharp(trimmed).resize({ width: w }).png({ compressionLevel: 9, palette: true, quality: 90 }), path.join(outDir, `logo-${w}.png`));
  }

  // Favicons: "V" vermelho do logo sobre preto (legível em 32px) + logo completo para ícones grandes.
  const vCrop = await (await load(src))
    .extract({ left: 90, top: 770, width: 468, height: 470 })
    .resize(360, 360, { fit: "contain", background: "#050505" })
    .toBuffer();
  const roundedMask = (s, r) =>
    Buffer.from(`<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
  for (const s of [32, 48]) {
    await save(sharp(vCrop).resize(s, s).composite([{ input: roundedMask(s, s * 0.2), blend: "dest-in" }]).png(), path.join(PUBLIC, `favicon-${s}.png`));
  }
  const logoOnBlack = async (s, pad) => {
    const inner = Math.round(s * (1 - pad * 2));
    const logo = await sharp(trimmed).resize({ width: inner }).toBuffer();
    return sharp({ create: { width: s, height: s, channels: 4, background: "#050505" } })
      .composite([{ input: logo, gravity: "center" }])
      .png();
  };
  await save((await logoOnBlack(180, 0.1)), path.join(PUBLIC, "apple-touch-icon.png"));
  await save((await logoOnBlack(192, 0.12)), path.join(PUBLIC, "icon-192.png"));
  await save((await logoOnBlack(512, 0.12)), path.join(PUBLIC, "icon-512.png"));
  return trimmed;
}

async function buildOgImage(logoPng, closedFrame) {
  const W = 1200, H = 630;
  const burger = await (await load(closedFrame)).extract({ left: 380, top: 120, width: 1160, height: 960 }).resize({ height: 600 }).toBuffer();
  const logo = await sharp(logoPng).resize({ width: 520 }).toBuffer();
  const text = Buffer.from(`<svg width="${W}" height="${H}">
    <rect x="64" y="470" width="64" height="4" fill="#E52023"/>
    <text x="64" y="520" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" fill="#F5F5F5" letter-spacing="3">BURGER • PIZZA • GRILL</text>
    <text x="64" y="562" font-family="Arial, sans-serif" font-size="24" fill="#C9A45C" letter-spacing="1">Itapecuru-Mirim — MA</text>
  </svg>`);
  const fade = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0.38" stop-color="#050505" stop-opacity="1"/><stop offset="0.62" stop-color="#050505" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  await save(sharp({ create: { width: W, height: H, channels: 4, background: "#050505" } })
    .composite([
      { input: burger, left: 520, top: 30 },
      { input: fade, left: 0, top: 0 },
      { input: logo, left: 48, top: 90 },
      { input: text, left: 0, top: 0 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    , path.join(PUBLIC, "og-image.jpg"));
}

function ffmpeg(args) {
  execFileSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

async function buildVideo() {
  const src = path.join(ORIGINALS, "videos", VIDEO_ORIGINAL);
  const outDir = path.join(OUT, "videos");
  await mkdir(outDir, { recursive: true });
  // -g 5 + sem B-frames: cada seek decodifica no máximo 4 quadros -> scrub fluido nos dois sentidos.
  const common = ["-an", "-c:v", "libx264", "-preset", "slow", "-bf", "0", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart"];
  const desktop = path.join(outDir, "burger-intro-1080.mp4");
  const mobile = path.join(outDir, "burger-intro-mobile.mp4");
  if (FORCE || !(await exists(desktop))) ffmpeg(["-i", src, ...common, "-crf", "25", "-g", "5", "-keyint_min", "5", desktop]);
  // Mobile: recorte central 1200x1080 (o hambúrguer inteiro cabe) -> 800x720, bem mais leve.
  if (FORCE || !(await exists(mobile))) ffmpeg(["-i", src, "-vf", "crop=1200:1080:360:0,scale=800:720:flags=lanczos", ...common, "-crf", "26", "-g", "5", "-keyint_min", "5", mobile]);

  // WebM/VP9 como alternativa para navegadores sem H.264 (ex.: builds do Chromium sem codecs proprietários).
  const vp9 = ["-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-g", "5", "-keyint_min", "5", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p"];
  const desktopWebm = path.join(outDir, "burger-intro-1080.webm");
  const mobileWebm = path.join(outDir, "burger-intro-mobile.webm");
  if (FORCE || !(await exists(desktopWebm))) ffmpeg(["-i", src, ...vp9, "-crf", "36", desktopWebm]);
  if (FORCE || !(await exists(mobileWebm))) ffmpeg(["-i", src, "-vf", "crop=1200:1080:360:0,scale=800:720:flags=lanczos", ...vp9, "-crf", "36", mobileWebm]);

  // Posters: primeiro quadro (aberto) e último (fechado — fallback se o vídeo falhar / reduced motion).
  const tmp = path.join(ROOT, ".cache");
  await mkdir(tmp, { recursive: true });
  const first = path.join(tmp, "frame-first.png");
  const last = path.join(tmp, "frame-last.png");
  ffmpeg(["-i", src, "-frames:v", "1", "-update", "1", first]);
  ffmpeg(["-sseof", "-0.05", "-i", src, "-frames:v", "1", "-update", "1", last]);
  for (const [name, file] of [["open", first], ["closed", last]]) {
    await save((await load(file)).resize({ width: 1920 }).webp({ quality: 80 }), path.join(outDir, `burger-${name}-1920.webp`));
    await save((await load(file)).resize({ width: 1920 }).jpeg({ quality: 80, mozjpeg: true }), path.join(outDir, `burger-${name}-1920.jpg`));
    const crop = (await load(file)).extract({ left: 360, top: 0, width: 1200, height: 1080 }).resize({ width: 800 });
    await save(crop.clone().webp({ quality: 80 }), path.join(outDir, `burger-${name}-mobile.webp`));
    await save(crop.clone().jpeg({ quality: 80, mozjpeg: true }), path.join(outDir, `burger-${name}-mobile.jpg`));
  }
  return last;
}

async function preserveOriginals() {
  if (!(await exists(INBOX))) return false; // já importado: /source-assets passa a ser a fonte
  for (const e of CATALOG) {
    const dir = path.join(ORIGINALS, e.cat);
    await mkdir(dir, { recursive: true });
    await copyFile(path.join(e.from ?? ZIP_DIR, e.file), path.join(dir, e.file));
  }
  await mkdir(path.join(ORIGINALS, "videos"), { recursive: true });
  await copyFile(path.join(INBOX, "burger-intro-original.mp4"), path.join(ORIGINALS, "videos", VIDEO_ORIGINAL));
  const lines = ["# Arquivos originais (não alterados)", "", "| Arquivo | Categoria | Observação |", "|---|---|---|"];
  for (const e of CATALOG) lines.push(`| ${e.file} | ${e.cat} | ${e.note ?? (e.crop ? `recortado na versão web (${e.crop.width}x${e.crop.height} a partir de ${e.crop.left},${e.crop.top})` : "")} |`);
  lines.push(`| ${VIDEO_ORIGINAL} | videos | vídeo da intro (reencodado em /public/assets/videos) |`);
  await writeFile(path.join(ORIGINALS, "README.md"), lines.join("\n") + "\n");
  return true;
}

async function main() {
  if (await preserveOriginals()) console.log("✓ originais importados para /source-assets");
  const closedFrame = await buildVideo();
  console.log("✓ vídeo + posters");
  const logo = await buildLogo();
  console.log("✓ logo + favicons");
  await buildOgImage(logo, closedFrame);
  console.log("✓ og-image");
  const manifest = {};
  for (const e of CATALOG.filter((c) => !c.kind && !c.note)) {
    const m = await encodeImage(e);
    manifest[m.key] = m;
    process.stdout.write(".");
  }
  const ts = `// Gerado por scripts/build-assets.mjs — não editar manualmente.\nexport const ASSETS = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport type AssetKey = keyof typeof ASSETS;\n`;
  await mkdir(path.join(ROOT, "src/data"), { recursive: true });
  await writeFile(path.join(ROOT, "src/data/assets.generated.ts"), ts);
  console.log("\n✓ manifest src/data/assets.generated.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
