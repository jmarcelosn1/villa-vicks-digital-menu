import { useEffect, useRef } from "react";
import { useWhatsAppLink } from "@/lib/whatsapp";
import { external } from "@/data/site";

/**
 * Barra fixa de pedido no celular (zona do polegar) — padrão de restaurante "pedido online sempre à mão".
 * Aparece depois da intro; some no Delivery (que já tem o botão), na Localização (cartão com "Como chegar") e no rodapé.
 * Escondida, fica `inert`: fora da navegação por teclado e leitores de tela.
 */
export function MobileOrderBar() {
  const whatsapp = useWhatsAppLink();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let ticking = false;
    const visibleOnScreen = (node: Element | null) => {
      if (!node) return false;
      const r = node.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const update = () => {
      ticking = false;
      const heroBottom = document.getElementById("inicio")?.getBoundingClientRect().bottom ?? 0;
      const show = heroBottom < window.innerHeight * 0.5 && !visibleOnScreen(document.getElementById("delivery")) && !visibleOnScreen(document.getElementById("localizacao")) && !visibleOnScreen(document.querySelector("footer"));
      if (el.dataset.show !== String(show)) {
        el.dataset.show = String(show);
        el.inert = !show;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-show="false"
      inert
      className="fixed inset-x-0 bottom-0 z-40 translate-y-[110%] border-t border-white/10 bg-ink/[0.97] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out data-[show=true]:translate-y-0 motion-reduce:transition-none sm:hidden"
    >
      <div className="flex gap-2">
        <a href={whatsapp} {...external} className="btn btn-primary min-w-0 flex-1 px-4">
          Pedir pelo WhatsApp
        </a>
        <a href="#cardapio" className="btn btn-paper px-5">
          Cardápio
        </a>
      </div>
    </div>
  );
}
