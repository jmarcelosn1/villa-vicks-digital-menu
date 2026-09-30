import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import MorphGallery from "@/components/ui/morph-gallery";
import { Container } from "@/components/Container";
import { MENU, MENU_ITEMS, external, type MenuCategoryId } from "@/data/site";
import { menuStore, useMenuCategory } from "@/lib/menu-store";
import { menuPhoto, menuTexture, menuThumb } from "@/lib/menu-photos";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/lib/use-drag-scroll";

/*
 * Cardápio — um palco só para as três cozinhas.
 * A MorphGallery troca de foto dissolvendo uma na outra: ao mudar de Burger para Pizza ou Grill,
 * ao escolher um prato na lista ou nas setas/deslize do palco. Foto, nome, descrição, grupo e
 * lista ficam sempre sincronizados com o mesmo índice (MENU_ITEMS).
 */

const GALLERY = MENU_ITEMS.map((i) => ({ src: menuPhoto(i.key), alt: i.title }));
const FIRST = Object.fromEntries(MENU.map((c) => [c.id, MENU_ITEMS.findIndex((i) => i.category === c.id)])) as Record<MenuCategoryId, number>;

export function MenuSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const cat = useMenuCategory();
  // Último prato visto em cada cozinha: voltar para a aba devolve o mesmo prato.
  const [picked, setPicked] = useState<Record<MenuCategoryId, number>>(FIRST);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;

  const active = picked[cat];
  const item = MENU_ITEMS[active];
  const category = MENU.find((c) => c.id === cat)!;
  const group = category.groups.find((g) => g.name === item.group)!;
  const groupItems = MENU_ITEMS.map((it, i) => ({ it, i })).filter(({ it }) => it.category === cat && it.group === item.group);

  // Faixa de pratos: desliza da esquerda para a direita (arrastar com o mouse também funciona).
  useDragScroll(listRef, `${cat}/${item.group}`);

  const select = (i: number) => {
    const next = MENU_ITEMS[i];
    setPicked((p) => ({ ...p, [next.category]: i }));
    menuStore.set(next.category);
  };

  // Depois da foto atual: vizinhas na lista e o prato aberto nas outras abas.
  // Depois da foto atual: vizinhas, o prato aberto nas outras abas e o resto da aba atual
  // (trocar de prato ou de aba não espera a foto baixar).
  const prefetch = (i: number) => {
    const n = MENU_ITEMS.length;
    const others = MENU.map((c) => pickedRef.current[c.id]).filter((j) => j !== i);
    const sameTab = MENU_ITEMS.map((it, j) => ({ it, j })).filter(({ it, j }) => it.category === MENU_ITEMS[i].category && j !== i).map(({ j }) => j);
    return [(i + 1) % n, (i - 1 + n) % n, ...others, ...sameTab];
  };

  // Miniaturas da aba aberta (todos os grupos) já no cache: trocar Burgers/Dogs/Porções é instantâneo
  useEffect(() => {
    // aba aberta primeiro, depois as outras (são ~12 KB cada): no 4G, tocar em Dogs/Porções já acha tudo no cache
    const load = () => [...MENU_ITEMS].sort((a, b) => Number(b.category === cat) - Number(a.category === cat)).forEach((it) => (new Image().src = menuThumb(it.key)));
    const id = window.requestIdleCallback ? window.requestIdleCallback(load, { timeout: 800 }) : window.setTimeout(load, 200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      window.clearTimeout(id);
    };
  }, [cat]);

  // Clima de fundo acompanha a cozinha aberta (a mesma camada que muda com o scroll).
  useEffect(() => {
    const section = sectionRef.current;
    const layer = document.getElementById("mood-layer");
    if (!section || !layer) return;
    const r = section.getBoundingClientRect();
    const line = window.innerHeight * 0.55;
    if (r.top < line && r.bottom > line) gsap.to(layer, { backgroundColor: category.bg, duration: 0.9, ease: "power1.out", overwrite: "auto" });
  }, [category.bg]);

  // No celular a lista é uma faixa horizontal: mantém o prato escolhido à vista.
  useEffect(() => {
    const ul = listRef.current;
    const el = ul?.querySelector<HTMLElement>('[aria-pressed="true"]')?.closest("li");
    if (!ul || !el || ul.scrollWidth <= ul.clientWidth + 1) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({ left: el.offsetLeft - (ul.clientWidth - el.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  return (
    <section ref={sectionRef} id="cardapio" data-mood={category.bg} aria-labelledby="cardapio-title" className="relative pt-24 pb-10 sm:py-32">
      <Container className="flex flex-col items-center text-center">
        <h2 id="cardapio-title" data-reveal className="display text-[clamp(3rem,10vw,7rem)]">
          Escolha o seu Vick's
        </h2>
        <p data-reveal className="mt-5 max-w-[42ch] text-base leading-relaxed text-smoke sm:text-lg">
          Três cozinhas no mesmo endereço. Escolha um prato para ver a foto e o que vai nele.
        </p>
      </Container>

      <Container className="mt-12 sm:mt-14">
        {/*
          Enquadramento: ao chegar no cardápio, tudo cabe numa tela só.
          Desktop: foto fixa à esquerda (tamanho pela altura da tela) e abas, prato e lista à direita.
          Celular/tablet: abas → foto → pratos → descrição; a foto encolhe para a faixa de pratos caber junto.
        */}
        {/* Alvos reais de #burger, #pizza e #grill (sem JS ou para buscadores); com JS o link abre a aba */}
        <div aria-hidden="true" className="relative h-0">
          {MENU.map((c) => (
            <span key={c.id} id={c.id} className="absolute top-0 scroll-mt-4" />
          ))}
        </div>
        <div id="cardapio-palco" className="grid scroll-mt-4 grid-cols-1 items-start gap-y-5 sm:gap-y-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-6">
          {/* Troca de cozinha: a foto se dissolve na da outra aba */}
          <div data-reveal className="min-w-0 text-center lg:col-start-2 lg:row-start-1 lg:text-left">
            <div role="group" aria-label="Cozinha" className="mx-auto grid max-w-lg grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:mx-0 lg:max-w-md">
              {MENU.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === cat}
                  onClick={() => menuStore.set(c.id)}
                  className="display min-h-12 rounded-full px-3 text-[clamp(1.15rem,4.2vw,1.5rem)] tracking-[0.04em] text-bone/60 transition-[background-color,color,box-shadow] duration-300 hover:text-bone aria-pressed:bg-vred aria-pressed:text-white aria-pressed:shadow-[0_3px_0_#7d0a0f]"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p key={cat} className={cn("display mt-3 sm:mt-4 text-[clamp(1.15rem,3.4vw,1.75rem)] animate-in fade-in duration-500 motion-reduce:animate-none", category.accent)}>
              {category.headline}
            </p>
          </div>

          <div className="min-w-0 lg:sticky lg:top-[calc(var(--hdr)+1rem)] lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div data-reveal-clip className="menu-stage photo mx-auto aspect-square shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)] lg:mr-0">
              <MorphGallery
                items={GALLERY}
                index={active}
                onIndexChange={select}
                resolveTexture={(_, i) => menuTexture(MENU_ITEMS[i].key)}
                prefetch={prefetch}
                label="Fotos do cardápio"
                prevLabel="Prato anterior"
                nextLabel="Próximo prato"
                arrows={false}
                className="absolute! inset-0"
              >
                {/* Celular/tablet: o nome do prato na própria foto (a descrição vem logo abaixo da faixa) */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/80 via-black/35 to-transparent pt-14 pr-4 pb-4 pl-4 lg:hidden">
                  <p key={item.key} className="display text-[clamp(1.35rem,6.5vw,2rem)] leading-[1.02] text-white animate-in fade-in duration-500 motion-reduce:animate-none">
                    {item.title}
                  </p>
                </div>
              </MorphGallery>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-2">
            <div data-reveal className="order-3 lg:order-1 lg:min-h-[9.5rem]">
              <div key={item.key} className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
                <h3 className="display text-[clamp(2.1rem,7vw,3.6rem)] leading-[1.02]">{item.title}</h3>
                {item.desc && <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-bone/85 sm:text-[1.05rem]">{item.desc}</p>}
                {group.note && <p className="mt-2 max-w-[46ch] text-[0.92rem] leading-relaxed text-smoke">{group.note}</p>}
              </div>
            </div>

            {category.groups.length > 1 && (
              <div data-reveal role="group" aria-label="Seção do cardápio" className="order-1 flex flex-wrap justify-center gap-2 lg:order-2 lg:mt-1 lg:justify-start">
                {category.groups.map((g) => {
                  const first = MENU_ITEMS.findIndex((it) => it.category === cat && it.group === g.name);
                  return (
                    <button
                      key={g.name}
                      type="button"
                      aria-pressed={g.name === item.group}
                      onClick={() => select(first)}
                      className="min-h-11 rounded-full border border-white/15 px-4 text-[0.92rem] font-semibold text-bone/75 transition-colors hover:border-white/40 hover:text-bone aria-pressed:border-bone aria-pressed:bg-bone aria-pressed:text-ink"
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* nova lista (outra aba ou grupo): os pratos entram em cascata, como as frases da intro */}
            <ul
              key={`${cat}/${item.group}`}
              ref={listRef}
              aria-label={`${category.label}: ${item.group}`}
              className="dish-strip relative order-2 -mx-5 -mt-2 flex snap-x gap-2 overflow-x-auto overscroll-x-contain px-5 pt-1 pb-3 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:order-3 lg:mx-0 lg:mt-0 lg:cursor-grab lg:gap-2.5 lg:px-0 data-[dragging=true]:cursor-grabbing [&::-webkit-scrollbar]:hidden"
            >
              {groupItems.map(({ it, i }, n) => (
                <li
                  key={it.key}
                  className="w-[6.75rem] shrink-0 snap-start animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] motion-reduce:animate-none lg:w-[7.5rem]"
                  style={{ animationDelay: `${Math.min(n, 8) * 45}ms` }}
                >
                  <button
                    type="button"
                    aria-pressed={i === active}
                    onClick={() => select(i)}
                    className="group flex w-full flex-col gap-2 rounded-2xl p-1.5 text-left transition-colors hover:bg-white/[0.05] aria-pressed:bg-white/[0.08]"
                  >
                    <img
                      src={menuThumb(it.key)}
                      alt=""
                      width={200}
                      height={200}
                      decoding="async"
                      draggable={false}
                      className="aspect-square w-full shrink-0 rounded-xl bg-char object-cover ring-2 ring-transparent transition-shadow group-aria-pressed:ring-vred"
                    />
                    <span className="line-clamp-2 text-[0.88rem] leading-snug font-semibold text-bone/70 group-hover:text-bone group-aria-pressed:text-bone">
                      {it.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {category.notes && (
              <ul className="order-4 flex flex-wrap gap-2">
                {category.notes.map((n) => (
                  <li key={n} className="rounded-full border border-white/[0.14] px-4 py-2 text-sm text-bone/80">
                    {n}
                  </li>
                ))}
              </ul>
            )}

            <div data-reveal className="order-5 mt-2">
              <a href={category.href} {...external} className="btn btn-primary">
                {category.cta}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
