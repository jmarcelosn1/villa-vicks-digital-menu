import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SITE, external } from "@/data/site";
import { Picture } from "@/components/Picture";
import { Logo } from "@/components/Logo";
import { Dot } from "@/components/icons";
import { Container } from "@/components/Container";
import { MenuSection } from "@/components/MenuShowcase";
import { MapEmbed } from "@/components/MapEmbed";
import { useWhatsAppLink } from "@/lib/whatsapp";
import { OpenStatus } from "@/components/OpenStatus";

/*
 * Animações de scroll: intro do burger, embalagem rasgando, entrada de textos/fotos em cada seção
 * e a troca suave de "clima" de fundo (entre seções e entre as cozinhas do cardápio).
 */

/* ------------------------------------------------------------------ */
/* Ambiente                                                            */
/* ------------------------------------------------------------------ */

function AmbienceSection() {
  return (
    <section id="ambiente" data-mood="#000000" aria-labelledby="ambiente-title" className="relative py-24 sm:py-32 lg:py-40">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h2 id="ambiente-title" data-reveal className="display text-[clamp(3rem,11vw,6.6rem)] lg:text-[min(6.6rem,7.4vw)]">
            Mais que comida.
          </h2>
          <p data-reveal className="display mt-3 text-[clamp(1.5rem,4.6vw,2.4rem)] text-mustard">Um ambiente tranquilo e agradável.</p>
          <p data-reveal className="mt-6 max-w-[40ch] text-base leading-relaxed text-smoke sm:text-lg">
            Mesas ao ar livre na Vila Food, gente reunida e o cheiro da brasa no ar. Venha com a turma, a família ou para um jantar a dois.
          </p>
        </div>
        <figure className="lg:col-span-7">
          <div data-reveal-clip className="photo aspect-[411/250] w-full">
            <Picture asset="22-ambiente" alt="Área de mesas da Villa Vick's à noite, cheia de gente, com árvore e luzes" sizes="(min-width: 1024px) 640px, 92vw" />
          </div>
          <figcaption data-reveal className="mt-3 text-sm text-smoke">Vila Food, Arena Jesus, em Itapecuru-Mirim.</figcaption>
        </figure>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Atendimento                                                         */
/* ------------------------------------------------------------------ */

function ServiceSection() {
  return (
    <section id="atendimento" data-mood="#000000" aria-labelledby="atendimento-title" className="relative pb-24 sm:pb-32 lg:pb-40">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <div data-reveal-clip className="photo mx-auto aspect-[340/386] w-[86%] max-w-[420px] sm:w-full lg:mx-0">
            <Picture asset="23-atendimento" alt="Atendente da Villa Vick's sorrindo e apresentando um burger com bacon" sizes="(min-width: 1024px) 420px, 80vw" />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <h2 id="atendimento-title" data-reveal className="display text-[clamp(2.9rem,10.5vw,5.4rem)] lg:text-[min(5.4rem,7vw)]">
            Atendimento de excelência.
          </h2>
          <p data-reveal className="mt-6 max-w-[38ch] text-base leading-relaxed text-smoke sm:text-lg">
            Do primeiro pedido ao último pedaço: gente que recebe bem e capricha em cada prato.
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

function DeliverySection() {
  const whatsapp = useWhatsAppLink();
  // A arte "Nosso delivery tá ON!" do cliente, refeita em código: nítida em qualquer tela, em tela cheia.
  return (
    <section
      id="delivery"
      aria-labelledby="delivery-title"
      className="relative isolate flex min-h-[calc(var(--svh,1svh)*100)] items-center overflow-hidden py-24 text-white"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(75%_65%_at_50%_45%,#ea262c_0%,#c3121a_55%,#8a0a10_100%)]" />
      {/* pizzas de verdade entrando pelos cantos, como na arte */}
      <div data-reveal aria-hidden="true" className="absolute -top-[9vmin] -left-[12vmin] size-[min(46vmin,380px)] -rotate-12 overflow-hidden rounded-full shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-8 ring-black/10">
        <Picture asset="09-vicks-pizza-01" alt="" sizes="380px" className="block h-full w-full" imgClassName="h-full w-full object-cover" />
      </div>
      <div data-reveal aria-hidden="true" className="absolute -right-[14vmin] -bottom-[12vmin] size-[min(54vmin,440px)] rotate-12 overflow-hidden rounded-full shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] ring-8 ring-black/10">
        <Picture asset="13-vicks-pizza-02" alt="" sizes="440px" className="block h-full w-full" imgClassName="h-full w-full object-cover" />
      </div>

      <Container className="relative flex flex-col items-center text-center">
        <h2 id="delivery-title" data-reveal className="font-slab text-[clamp(3.6rem,15vw,10.5rem)] landscape:text-[clamp(2.6rem,min(12vw,calc(var(--svh,1svh)*14)),9rem)] leading-[0.98] tracking-[-0.01em] [text-shadow:0_0.06em_0_rgb(90_0_6/0.45)]">
          <span className="block">Nosso</span>
          <span className="block text-[#ffc42e]">delivery</span>
          <span className="block">
            tá <span className="underline decoration-[0.07em] underline-offset-[0.1em]">ON</span>!
          </span>
        </h2>

        <a
          data-reveal
          href={SITE.phoneHref}
          className="mt-10 inline-flex flex-col items-center rounded-[1.4rem] bg-[#ffc42e] px-8 py-3 text-[#b3121a] shadow-[0_0.5rem_0_rgb(110_0_8/0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          aria-label={`Peça já: ligar para ${SITE.phoneDisplay}`}
        >
          <span className="text-[0.95rem] font-bold tracking-[0.04em]">PEÇA JÁ!</span>
          <span className="font-slab text-[clamp(1.7rem,6.5vw,2.8rem)] leading-tight">{SITE.phoneDisplay}</span>
        </a>

        <div data-reveal className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={whatsapp} {...external} className="btn btn-dark">
            Pedir pelo WhatsApp
          </a>
        </div>
        <p data-reveal className="mt-5 text-white/85">
          Terça a domingo, das 18h às 23h30.
        </p>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Localização                                                         */
/* ------------------------------------------------------------------ */

function LocationSection() {
  return (
    <section id="localizacao" data-mood="#000000" aria-labelledby="local-title" className="relative py-24 sm:py-32 lg:py-36">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="local-title" data-reveal className="display text-[clamp(3.4rem,13vw,7.4rem)] lg:text-[min(7.4rem,8vw)]">
            Vem pro Vick's.
          </h2>
          <p data-reveal className="max-w-[34ch] text-base leading-relaxed text-smoke sm:pb-3 sm:text-right sm:text-lg">
            Na Vila Food, dentro da Arena Jesus, em {SITE.city}.
          </p>
        </div>

        {/* O mapa é o destaque; o cartão com endereço, horário e rota fica por cima */}
        <div data-reveal className="relative mt-10 h-[min(calc(var(--svh,1svh)*78),640px)] min-h-[440px] overflow-hidden rounded-[1.5rem] bg-char sm:mt-12">
          <MapEmbed />
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-ink/95 p-5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[23rem] sm:p-6">
            <OpenStatus />
            <p className="display mt-3 text-[clamp(1.7rem,6vw,2.1rem)] leading-[1.02] text-bone">Vila Food, Arena Jesus</p>
            <p className="mt-1 text-bone/75">
              {SITE.city}, {SITE.state}
            </p>
            <p className="mt-3 text-[0.95rem] text-smoke">Terça a domingo, das 18h às 23h30</p>
            <a href={SITE.links.maps} {...external} className="btn btn-primary mt-5 w-full">
              Como chegar
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Instagram                                                           */
/* ------------------------------------------------------------------ */

function InstagramSection() {
  return (
    <section data-mood="#000000" aria-labelledby="insta-title" className="relative border-t border-white/[0.08] py-24 sm:py-32">
      <Container className="flex flex-col items-center text-center">
        <h2 id="insta-title" translate="no" data-reveal className="display text-[clamp(2.8rem,12.5vw,8.5rem)]">
          {SITE.instagramHandle}
        </h2>
        <p data-reveal className="mt-5 max-w-[36ch] text-smoke">Lançamentos, promoções e o dia a dia da casa.</p>
        <a data-reveal href={SITE.links.instagram} {...external} className="btn btn-paper mt-9">
          Seguir no Instagram
        </a>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer — enxuto, sem repetir o conteúdo das seções                   */
/* ------------------------------------------------------------------ */

export function Footer() {
  const contact = "inline-flex min-h-11 items-center font-semibold text-bone/80 transition-colors hover:text-bone";
  return (
    <footer className="relative border-t border-white/[0.08] bg-coal">
      <Container className="flex flex-col items-center gap-8 py-14 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <Logo className="w-32" />
          <p className="display text-lg tracking-[0.1em]">
            Burger <Dot className="mx-1" /> Pizza <Dot className="mx-1" /> Grill
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-end">
          <a href={SITE.links.instagram} {...external} translate="no" className={contact}>
            {SITE.instagramHandle}
          </a>
          <a href={SITE.phoneHref} aria-label={`Ligar para ${SITE.phoneDisplay}`} className={contact}>
            {SITE.phoneDisplay}
          </a>
        </div>
      </Container>
      <div className="border-t border-white/[0.06]">
        <Container className="py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-smoke sm:text-left">
          <p>© {new Date().getFullYear()} Villa Vick's. Todos os direitos reservados.</p>
        </Container>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Composição                                                          */
/* ------------------------------------------------------------------ */

export function Sections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Troca suave do "clima" de fundo entre seções (Burger → Pizza → Grill → ...)
      // a intro fica fora deste bloco, mas entra na mesma troca de cor (senão sobra uma emenda preto → marrom)
      const intro = document.getElementById("inicio");
      [...(intro?.dataset.mood ? [intro] : []), ...gsap.utils.toArray<HTMLElement>("[data-mood]")].forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) gsap.to(moodRef.current, { backgroundColor: section.getAttribute("data-mood") ?? "#000000", duration: 0.9, ease: "power1.out", overwrite: "auto" });
          },
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        const clips = gsap.utils.toArray<HTMLElement>("[data-reveal-clip]");
        const all = [...items, ...clips];
        gsap.set(items, { autoAlpha: 0, y: 28 });
        gsap.set(clips, { clipPath: "inset(12% 0% 0% 0% round 1.25rem)", autoAlpha: 0.2 });

        // Idempotente: cada elemento anima uma única vez, venha o gatilho de onde vier.
        const shown = new WeakSet<Element>();
        const show = (els: Element[]) => {
          const fresh = els.filter((el) => !shown.has(el));
          if (!fresh.length) return;
          fresh.forEach((el) => shown.add(el));
          // O que já ficou acima da tela aparece sem animação (ninguém vê) — senão o stagger
          // de dezenas de elementos atrasaria em segundos o que está visível.
          const above = fresh.filter((el) => el.getBoundingClientRect().bottom < 0);
          if (above.length) gsap.set(above, { autoAlpha: 1, y: 0, clipPath: "none" });
          const visible = fresh.filter((el) => !above.includes(el));
          const plain = visible.filter((el) => el.hasAttribute("data-reveal"));
          if (plain.length) gsap.to(plain, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: Math.min(0.07, 0.5 / plain.length) });
          visible
            .filter((el) => el.hasAttribute("data-reveal-clip"))
            .forEach((el) => {
              gsap.to(el, { clipPath: "inset(0% 0% 0% 0% round 1.25rem)", autoAlpha: 1, duration: 1.2, ease: "power3.out", clearProps: "clipPath" });
              const img = el.querySelector("img:not([data-static])");
              if (img) gsap.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 1.4, ease: "power3.out" });
            });
        };

        ScrollTrigger.batch(all, { start: "top 90%", onEnter: show, onEnterBack: show });

        // Rede de segurança: página aberta no meio (reload, #âncora) ou scroll muito rápido.
        const sweep = () => show(all.filter((el) => !shown.has(el) && el.getBoundingClientRect().top < window.innerHeight * 0.95));
        ScrollTrigger.addEventListener("scrollEnd", sweep);
        ScrollTrigger.addEventListener("refresh", sweep);
        const raf = requestAnimationFrame(sweep);
        return () => {
          cancelAnimationFrame(raf);
          ScrollTrigger.removeEventListener("scrollEnd", sweep);
          ScrollTrigger.removeEventListener("refresh", sweep);
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  // Conteúdo chegou depois da intro: recalcula posições.
  useEffect(() => {
    ScrollTrigger.refresh();
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div ref={moodRef} id="mood-layer" aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-ink" />
      <MenuSection />
      <AmbienceSection />
      <ServiceSection />
      <DeliverySection />
      <LocationSection />
      <InstagramSection />
    </div>
  );
}
