/**
 * Caminhos de assets relativos à base do build ("./" no build de produção).
 * Com isso o site funciona tanto hospedado quanto aberto com dois cliques (file://).
 */
const BASE = import.meta.env.BASE_URL;

/** "/assets/x.webp" → "./assets/x.webp" (ou mantém, se a base for "/"). */
export const assetUrl = (p: string) => (p.startsWith("/") ? BASE + p.slice(1) : p);

/** Aplica assetUrl a cada URL de um srcset ("a.webp 400w, b.webp 800w"). */
export const assetSrcSet = (s: string) => s.replace(/(^|,\s*)\//g, `$1${BASE}`);
