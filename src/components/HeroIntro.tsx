import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SITE } from "@/data/site";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { Logo } from "@/components/Logo";
import { Dot } from "@/components/icons";
import { cn } from "@/lib/utils";
import { WrapperTearOverlay } from "@/components/ui/wrapper-tear-reveal";

/**
 * INTRO — o scroll rasga a embalagem e revela a marca.
 *
 *   0%  → 55% : o papel kraft rasga e sai da tela
 *   20% → 80% : logo, BURGER • PIZZA • GRILL, horário/local e "Ver cardápio" entram pela fresta, um por vez
 *   80%       : o menu do topo aparece; a página segue para o cardápio
 *
 * A trilha tem 2 telas de altura (1 tela de rolagem): o rasgo leva a mesma distância de antes e,
 * quando a marca termina de entrar, a intro acaba — sem trecho de rolagem "morto".
 */
const PHASES = { tearEnd: 0.55, brandStart: 0.2, brandItem: 0.3, brandStagger: 0.1 };

/** O menu do topo só aparece depois que a marca terminou de entrar. */
export const HEADER_SHOW_AT = 0.8;

export function HeroIntro() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-brand]", brandRef.current!);
      if (reduced) {
        gsap.set(items, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom bottom", scrub: 0.5, invalidateOnRefresh: true },
      });
      tl.to({}, { duration: 1 }, 0); // duração normalizada = progresso do scroll
      tl.fromTo(
        items,
        { autoAlpha: 0, y: 28, scale: (i: number) => (i === 0 ? 0.88 : 1) },
        { autoAlpha: 1, y: 0, scale: 1, duration: PHASES.brandItem, stagger: PHASES.brandStagger, ease: "power2.out" },
        PHASES.brandStart,
      );
    },
    { scope: sectionRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section id="inicio" ref={sectionRef} data-mood="#030303" aria-labelledby="hero-title" className={cn("relative", !reduced && "hero-track")}>
      <h1 id="hero-title" className="sr-only">
        Villa Vick's — Burger, Pizza e Grill em Itapecuru-Mirim
      </h1>

      <div className={cn("hero-stage relative w-full overflow-hidden", !reduced && "sticky top-0")}>
        {/* Abertura: a embalagem kraft rasga e revela a marca */}
        {!reduced && <WrapperTearOverlay triggerRef={sectionRef} portion={PHASES.tearEnd} />}

        {/* brilho quente atrás da logo (o palco não fica um preto chapado) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_46%,rgb(229_32_35/0.16)_0%,transparent_70%)]"
        />

        {/* Identidade Villa Vick's, no centro da tela */}
        <div
          ref={brandRef}
          className="relative z-10 flex h-full flex-col items-center justify-center px-5 pt-[var(--hdr)] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
        >
          <div data-brand className="invisible">
            <Logo
              size={640}
              eager
              alt=""
              className="w-[min(72vw,22rem,calc(var(--svh,1svh)*30*1.66))] landscape:w-[min(40vw,28rem,calc(var(--svh,1svh)*36*1.66))]"
            />
          </div>

          <p data-brand className="display invisible mt-[clamp(0.8rem,calc(var(--svh,1svh)*2.6),1.75rem)] text-[clamp(1.4rem,5vw,2.2rem)] tracking-[0.1em] text-bone landscape:text-[clamp(1.2rem,min(2.6vw,calc(var(--svh,1svh)*5.6)),2.6rem)]">
            Burger <Dot className="mx-[0.35em]" /> Pizza <Dot className="mx-[0.35em]" /> Grill
          </p>

          <ul data-brand className="invisible mt-[clamp(0.6rem,calc(var(--svh,1svh)*1.8),1.25rem)] space-y-1.5 text-[0.9rem] text-smoke sm:text-base landscape:text-[clamp(0.8rem,calc(var(--svh,1svh)*2),1.05rem)]">
            <li>
              <span className="text-bone">Terça a domingo</span>, das 18h às 23h30
            </li>
            <li>
              <span className="text-bone">Vila Food, Arena Jesus</span>, {SITE.city}
            </li>
          </ul>

          <div data-brand className="invisible mt-[clamp(1.1rem,calc(var(--svh,1svh)*3.2),2.25rem)] flex w-full max-w-sm justify-center">
            <a href="#cardapio" className="btn btn-primary min-w-[12rem] flex-1 sm:flex-none">
              Ver cardápio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
