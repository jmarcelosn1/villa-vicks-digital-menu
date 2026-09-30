import { lazy, Suspense, useEffect } from "react";
import { scrollToId } from "@/lib/scroll-to";
import { hideBootCover } from "@/lib/boot";
import { Header } from "@/components/Header";
import { HeroIntro } from "@/components/HeroIntro";
import { MobileOrderBar } from "@/components/MobileOrderBar";

// Resto da página em import() separado: com o build de arquivo único ele fica embutido no HTML.
const Sections = lazy(() => import("@/components/Sections").then((m) => ({ default: m.Sections })));
const Footer = lazy(() => import("@/components/Sections").then((m) => ({ default: m.Footer })));

export default function App() {
  // A intro já desenhou a capa (efeitos dos filhos rodam antes): tira a capa estática do HTML.
  useEffect(() => hideBootCover(), []);

  // Todos os links internos (#...) passam pelo mesmo scroll: suave quando perto, direto quando longe.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      const id = a?.getAttribute("href")?.slice(1);
      if (!a || !id) return;
      if (scrollToId(id, { focus: a.hasAttribute("data-skip") })) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <a
        href="#cardapio"
        data-skip
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-mustard focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <HeroIntro />
        <Suspense fallback={<div className="min-h-screen" />}>
          <Sections />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <MobileOrderBar />
    </>
  );
}
