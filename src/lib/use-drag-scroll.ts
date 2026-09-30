import { useEffect, type RefObject } from "react";

/**
 * Faixa horizontal que desliza: no celular/touchpad é o scroll nativo; com mouse, arrastar
 * também desliza (sem setas). Marca no elemento se está no começo/fim (para o esmaecido das bordas)
 * e se está sendo arrastada. Um arraste não vira clique no prato em que o mouse foi solto.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>, resetKey?: unknown) {
  // bordas: começo / fim
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.dataset.atStart = String(el.scrollLeft <= 2);
      el.dataset.atEnd = String(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref, resetKey]);

  // arrastar com o mouse
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pointer = -1;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
      pointer = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      moved = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        el.setPointerCapture(pointer);
        el.dataset.dragging = "true";
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = -1;
      if (!moved) return;
      delete el.dataset.dragging;
      // o clique que vem logo depois do arraste não seleciona o prato
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      el.addEventListener("click", swallow, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [ref, resetKey]);
}
