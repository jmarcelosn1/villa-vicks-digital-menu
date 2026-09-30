import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SITE, external } from "@/data/site";
import { Logo } from "@/components/Logo";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { scrollToId } from "@/lib/scroll-to";
import { menuStore } from "@/lib/menu-store";
import { OpenStatus } from "@/components/OpenStatus";
import { useWhatsAppLink } from "@/lib/whatsapp";
import { HEADER_SHOW_AT } from "@/components/HeroIntro";

export function Header() {
  const whatsapp = useWhatsAppLink();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);
  const [active, setActive] = useState<string>("inicio");

  // Fundo aparece após o início do scroll — atributo no DOM, sem re-render por pixel.
  useEffect(() => {
    const el = ref.current!;
    let ticking = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      ticking = false;
      el.dataset.scrolled = window.scrollY > 24 ? "true" : "false";
      // Escondido durante a intro: aparece quando o burger termina de montar e assentar.
      const hero = document.getElementById("inicio");
      const range = hero ? hero.offsetHeight - window.innerHeight : 0;
      const progress = hero && range > 0 ? Math.min(Math.max(-hero.getBoundingClientRect().top / range, 0), 1) : 1;
      const hidden = !reduced && progress < HEADER_SHOW_AT;
      if (el.dataset.hidden !== String(hidden)) {
        el.dataset.hidden = String(hidden);
        el.inert = hidden;
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
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Seção atual no menu: a que cruza a linha a 40% da tela (só muda o estado quando troca de seção).
  // Dentro do cardápio, o item ativo é a cozinha aberta (Burger, Pizza ou Grill).
  useEffect(() => {
    let ticking = false;
    const crosses = (el: Element | null, line: number) => {
      const r = el?.getBoundingClientRect();
      return !!r && r.top <= line && r.bottom > line;
    };
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.4;
      if (crosses(document.getElementById("cardapio"), line)) return setActive(menuStore.get());
      setActive(NAV.find(({ id }) => crosses(document.getElementById(id), line))?.id ?? "");
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    const unsubscribe = menuStore.subscribe(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // No menu mobile: fecha primeiro (libera o scroll travado pelo Dialog) e só depois navega.
  const onMobileNav = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    pendingTarget.current = id;
    setOpen(false);
  };

  const goToPending = (e: Event) => {
    const id = pendingTarget.current;
    if (!id) return;
    e.preventDefault();
    pendingTarget.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(id)));
  };

  return (
    <header
      ref={ref}
      data-scrolled="false"
      data-hidden="true"
      className="group/header fixed inset-x-0 top-0 z-50 h-[var(--hdr)] border-b border-white/[0.06] bg-ink transition-[transform,opacity,background-color] duration-500 ease-out lg:bg-ink/80 lg:backdrop-blur-md data-[hidden=true]:pointer-events-none data-[hidden=true]:-translate-y-full data-[hidden=true]:opacity-0 lg:data-[scrolled=true]:bg-ink/95 motion-reduce:transition-none"
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <a href="#inicio" className="-ml-1 flex shrink-0 items-center rounded-sm p-1" aria-label="Villa Vick's — voltar ao início">
          <Logo eager alt="" className="w-[5.6rem] lg:w-[7rem]" />
        </a>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-3">
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                  className="relative inline-flex min-h-11 items-center px-3 text-[0.95rem] font-medium text-bone/65 transition-colors hover:text-bone aria-[current=true]:text-bone after:absolute after:inset-x-3 after:bottom-2 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-vred after:transition-transform after:duration-300 hover:after:scale-x-100 aria-[current=true]:after:scale-x-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <OpenStatus className="hidden xl:inline-flex" />
          <a href={whatsapp} {...external} className="btn btn-sm btn-primary hidden sm:inline-flex">
            Pedir pelo WhatsApp
          </a>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={open ? "Fechar menu" : "Abrir menu"}
                className="inline-flex size-11 items-center justify-center rounded-sm text-bone transition-colors hover:bg-white/10 lg:hidden"
              >
                <Menu aria-hidden="true" className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              onCloseAutoFocus={goToPending}
              className="w-full gap-0 border-l border-white/10 bg-ink p-0 text-bone sm:max-w-md"
            >
              <div className="flex h-[var(--hdr)] items-center justify-between px-4 sm:px-6">
                <Logo alt="" className="w-[5.6rem]" />
                <SheetClose asChild>
                  <button type="button" aria-label="Fechar menu" className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-white/10">
                    <X aria-hidden="true" className="size-6" />
                  </button>
                </SheetClose>
              </div>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navegue pelas seções da Villa Vick's</SheetDescription>

              <nav aria-label="Menu mobile" className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-8 sm:px-6">
                <ul className="space-y-1">
                  {NAV.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => onMobileNav(e, item.id)}
                        aria-current={active === item.id ? "true" : undefined}
                        className="group flex min-h-14 items-center justify-between border-b border-white/[0.07] py-2 aria-[current=true]:text-vred"
                      >
                        <span className="display text-[2.4rem] transition-colors group-hover:text-vred">{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 space-y-3 text-sm text-smoke">
                  <OpenStatus />
                  <a href={SITE.links.instagram} {...external} className="inline-flex min-h-11 items-center gap-2 text-bone hover:text-mustard">
                    {SITE.instagramHandle}
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
