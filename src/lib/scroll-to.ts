import { isMenuCategory, menuStore } from "@/lib/menu-store";

/**
 * Navegação por âncora: perto = rolagem suave; longe (> 2,5 telas) = salto direto.
 * Evita atravessar a intro inteira só para chegar ao cardápio.
 * A URL não ganha #seção: recarregar ou reabrir o site sempre começa na abertura (papel rasgando).
 * #burger, #pizza e #grill abrem a categoria no cardápio e rolam até ele.
 */
export function scrollToId(id: string, opts: { focus?: boolean } = {}) {
  if (isMenuCategory(id)) {
    menuStore.set(id);
    id = "cardapio-palco";
  }
  const el = document.getElementById(id);
  if (!el) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 2.5;
  el.scrollIntoView({ behavior: reduced || far ? "instant" : "smooth", block: "start" });
  if (opts.focus) {
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
  return true;
}
