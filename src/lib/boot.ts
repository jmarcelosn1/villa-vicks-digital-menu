/**
 * Capa estática (#boot, em app.html): o papel da abertura pintado antes do JavaScript.
 *
 * - Com a intro animada, quem tira a capa é o papel do React (WrapperTearOverlay), e só no PRIMEIRO
 *   TOQUE/ROLAGEM: até lá a capa do HTML é o que aparece. Assim o navegador mede a abertura (LCP)
 *   pela capa, que chega em ~1 s, e não por um "VICK'S" redesenhado depois (ele para de medir no
 *   primeiro toque). As duas são idênticas: a troca não aparece.
 * - Sem a intro animada (movimento reduzido), o App tira a capa assim que monta.
 */
let claimed = false;

/** O papel do React avisa que ele cuida da capa (roda antes do efeito do App). */
export function claimBootCover() {
  claimed = true;
}

export function hideBootCover({ force = false, fade = true } = {}) {
  if (claimed && !force) return;
  const boot = document.getElementById("boot");
  if (!boot) return;
  // dois quadros: garante que a capa do React já foi pintada por baixo antes de tirar esta
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!fade) return boot.remove();
      boot.classList.add("is-gone");
      window.setTimeout(() => boot.remove(), 300);
    }),
  );
}
