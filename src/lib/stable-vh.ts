import { ScrollTrigger } from "@/lib/gsap";

/**
 * Alturas de tela estáveis, no lugar de svh/dvh/lvh:
 *   --vh  = 1% da MAIOR altura já vista (comprimento da intro, palco do vídeo)
 *   --svh = 1% da MENOR altura já vista (o que precisa caber visível: burger, botão, cardápio)
 *
 * Em navegadores embutidos (Instagram, WhatsApp, Facebook) a barra de cima aparece ao rolar para
 * cima e o navegador redimensiona a página inteira — até svh/lvh mudam. A intro tem 3,4 telas de
 * altura: cada vez que a barra aparecia ela encolhia ~150 px e a página dava um tranco ("trava ao
 * voltar para cima"). No toque, os valores só se refazem quando a largura muda (girar o celular);
 * fora isso, --vh só cresce e --svh só diminui. No desktop acompanham a janela normalmente.
 */
const root = document.documentElement;
const touch = window.matchMedia("(pointer: coarse)").matches;

const probe = (css: string) => {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;" + css;
  root.appendChild(el);
  return el;
};
const large = probe("height:100vh;height:100lvh");
const small = probe("height:100vh;height:100svh");

let width = 0;
let big = 0;
let little = 0;
let refresh = 0;

function measure(initial = false) {
  const w = window.innerWidth;
  const ih = window.innerHeight;
  const hi = Math.max(ih, large.offsetHeight);
  const lo = Math.min(ih, small.offsetHeight || ih);
  const reset = !touch || w !== width || !big;
  width = w;
  const nextBig = reset ? hi : Math.max(big, hi);
  const nextLittle = reset ? lo : Math.min(little, lo);
  if (nextBig === big && nextLittle === little) return;
  const lengthChanged = nextBig !== big;
  big = nextBig;
  little = nextLittle;
  root.style.setProperty("--vh", `${big / 100}px`);
  root.style.setProperty("--svh", `${little / 100}px`);
  if (!initial && lengthChanged) {
    window.clearTimeout(refresh);
    refresh = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  }
}

measure(true);
window.addEventListener("resize", () => measure());
window.addEventListener("orientationchange", () => window.setTimeout(() => measure(), 300));
