import { assetUrl } from "@/lib/asset-url";

declare global {
  interface Window {
    __vvTex?: (key: string, uri: string) => void;
  }
}

/** Foto do palco e miniatura de um produto (`key` = "<categoria>/<slug>"). */
export const menuPhoto = (key: string) => assetUrl(`/assets/cardapio/${key}.webp`);
export const menuThumb = (key: string) => assetUrl(`/assets/cardapio/${key}-thumb.webp`);

type Waiter = { resolve: (uri: string) => void; reject: (e: Error) => void };
const waiting = new Map<string, Waiter[]>();

/**
 * URL da foto para virar textura WebGL.
 * No servidor é a própria foto. Aberto direto do disco (file://), o navegador não deixa imagem
 * local virar textura, então a mesma foto chega como data URI por um <script> (scripts clássicos
 * funcionam em file://, fetch e imagens com CORS não).
 */
export function menuTexture(key: string): Promise<string> {
  if (location.protocol !== "file:") return Promise.resolve(menuPhoto(key));
  window.__vvTex ??= (k, uri) => {
    const list = waiting.get(k);
    waiting.delete(k);
    list?.forEach((w) => w.resolve(uri));
  };
  return new Promise((resolve, reject) => {
    const list = waiting.get(key);
    if (list) {
      list.push({ resolve, reject });
      return;
    }
    waiting.set(key, [{ resolve, reject }]);
    const s = document.createElement("script");
    s.src = assetUrl(`/assets/cardapio/tex/${key.replace("/", "--")}.js`);
    s.async = true;
    s.onload = () => s.remove();
    s.onerror = () => {
      s.remove();
      const failed = waiting.get(key);
      waiting.delete(key);
      failed?.forEach((w) => w.reject(new Error(`textura ${key} indisponível`)));
    };
    document.head.appendChild(s);
  });
}
