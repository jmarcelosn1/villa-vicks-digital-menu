import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { assetUrl } from "@/lib/asset-url";
import { claimBootCover, hideBootCover } from "@/lib/boot";

/**
 * WrapperTearOverlay — o papel da embalagem cobre a intro e rasga com o scroll,
 * revelando o palco do hambúrguer por trás. No fim, as duas metades saem da tela.
 *
 * Adaptado do componente "Tiger Tear Reveal" (21st.dev): mantém a mecânica do rasgo
 * (rachadura, rasgo serrilhado, metades que se afastam girando, fibras e dobras do papel)
 * e troca o tigre pela própria intro do site, que aparece pela abertura.
 *
 * - O progresso é o trecho inicial (`portion`) da trilha da intro (ScrollTrigger no `triggerRef`).
 * - Leve no celular: cada metade (e a folha inteira) é desenhada UMA vez, numa camada própria;
 *   durante o scroll só mudam transform/opacity dessas camadas, que a placa de vídeo compõe.
 *   Redesenhar o SVG (papel com o desenho em alta resolução) a cada quadro travava a intro.
 * - Nada de setState por quadro: estilos escritos direto no DOM (refs), só quando mudam.
 */

type Pt = [number, number];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Tempos do rasgo dentro do trecho do papel (0–1). */
const stages = (q: number) => {
  // Começa suave (smoothstep na entrada) e termina ACELERANDO para fora da tela, sem frear no fim:
  // assim a saída do papel emenda direto no burger, que já está se montando por baixo.
  const t = clamp01((q - 0.14) / 0.86);
  const open = t < 0.25 ? 2 * t * t : t - 0.125 + ((t - 0.25) * (t - 0.25) * 2) / 9; // contínua, termina em 1 com velocidade
  return {
    crack: smooth(0.02, 0.18, q), // a rachadura corre a partir do meio da palavra
    open,
    // afastamento acelera no fim: começa rasgando devagar e termina saindo da tela
    leave: open * open,
    shake: smooth(0.14, 0.2, q) * (1 - smooth(0.24, 0.34, q)), // o tranco do rasgo
  };
};

/** Papel de embalagem (desenhos de lanche em traço marrom sobre creme) com impressão em vermelho Vick's. */
const PAPER = { base: "#e8dcd0", ink: "#4a2c17", red: "#d11b22", core: "#fbf5ec" };
/** Largura do ladrilho do papel em unidades do SVG: no celular maior, para os desenhos não ficarem minúsculos. */
const TILE = { landscape: 1000, portrait: 2400 };
const TILE_RATIO = 941 / 1672;

const CX = 500;
const CY = 318;
const FAR = 4000;

function tearLine(seed = 11, from = -800, to = 1800, step = 9, angle = -7): Pt[] {
  const r = rng(seed);
  const slope = Math.tan((angle * Math.PI) / 180);
  const out: Pt[] = [];
  for (let x = from; x <= to; x += step) {
    const fibre = (r() - 0.5) * 5;
    const tooth = r() < 0.09 ? (r() - 0.5) * 26 : 0;
    const wander = Math.sin(x * 0.019 + seed) * 10 + Math.sin(x * 0.053 + seed * 2) * 4;
    out.push([x, CY + (x - CX) * slope + wander + fibre + tooth]);
  }
  return out;
}

const pathOf = (pts: Pt[], close = true) => "M" + pts.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + (close ? "Z" : "");

function fibreWidths(n: number, open: number, seed: number) {
  const r = rng(seed);
  const k = Math.min(1, open * 4);
  return Array.from({ length: n }, (_, i) => k * (2.5 + 6 * (0.5 + 0.5 * Math.sin(i * 0.37 + seed)) * (0.6 + r() * 0.8)));
}

const CURLS: Record<"top" | "bottom", [number, number, number][]> = {
  top: [
    [300, 44, 30],
    [575, 30, 20],
    [790, 52, 34],
  ],
  bottom: [
    [205, 50, 32],
    [470, 34, 22],
    [690, 40, 28],
  ],
};

const LAYOUT = {
  // paisagem: recorte na arte; a distância final garante que as metades saiam da tela
  landscape: { frame: "36 44 928 468", travel: 900 },
  // retrato: quadro alto (a palavra ocupa a largura do celular)
  portrait: { frame: "50 -640 900 1916", travel: 1500 },
};


type Props = {
  /** Seção da intro (trilha longa). */
  triggerRef: RefObject<HTMLElement | null>;
  /** Fração inicial da trilha em que o papel rasga (ex.: 0.22). */
  portion: number;
  word?: string;
  tagline?: string;
};

/**
 * Geometria das camadas. Cada camada é o quadro do SVG ampliado por uma margem `m` (px) em volta da
 * tela: as metades giram e deslizam sem mostrar a borda da camada. O viewBox é calculado para dar
 * exatamente o mesmo enquadramento do quadro original com "xMidYMid meet" (e da capa estática do HTML).
 */
type Geo = { w: number; h: number; s: number; m: number; viewBox: string; ox: number; oy: number };

/**
 * `fit` = altura usada para enquadrar a arte (a da abertura). Se a tela cresce depois (a barra do
 * navegador do Instagram/Safari some no primeiro arraste), o papel só se estende para baixo: a arte
 * não se recentraliza — antes o "VICK'S" descia ~25 px logo depois de a página subir ("vai e volta").
 */
function geometry(w: number, h: number, frame: string, fit = h): Geo {
  const [vx, vy, vw, vh] = frame.split(" ").map(Number);
  const s = Math.min(w / vw, fit / vh);
  const offX = (w - vw * s) / 2;
  const offY = (fit - vh * s) / 2;
  const m = Math.ceil(Math.max(w, h) * 0.035) + 12;
  const u0 = vx - (offX + m) / s;
  const v0 = vy - (offY + m) / s;
  return {
    w,
    h,
    s,
    m,
    viewBox: `${u0} ${v0} ${(w + 2 * m) / s} ${(h + 2 * m) / s}`,
    // centro do giro (CX, CY) em px, dentro da camada
    ox: m + offX + (CX - vx) * s,
    oy: m + offY + (CY - vy) * s,
  };
}

export function WrapperTearOverlay({ triggerRef, portion, word = "VICK'S", tagline = "Bateu a fome?" }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const wholeRef = useRef<HTMLDivElement>(null);
  const crackRef = useRef<SVGPathElement>(null);
  const hintRef = useRef<SVGTextElement>(null);
  const halfRefs = { top: useRef<HTMLDivElement>(null), bottom: useRef<HTMLDivElement>(null) };
  const shadowRefs = { top: useRef<HTMLDivElement>(null), bottom: useRef<HTMLDivElement>(null) };
  const [size, setSize] = useState<{ w: number; h: number; fit: number } | null>(null);
  const line = useMemo(() => tearLine(), []);
  // As metades do rasgo só entram depois da abertura (ociosidade ou primeiro toque): montar o papel
  // três vezes de cara atrasava o site ficar pronto. Até o rasgo começar, só a folha inteira aparece.
  const [halvesReady, setHalvesReady] = useState(false);
  const redrawRef = useRef<() => void>(() => {});
  // Até o primeiro toque/rolagem, quem aparece é a capa estática do HTML (idêntica); as camadas daqui
  // ficam montadas por baixo, invisíveis. No primeiro toque elas assumem e a capa sai (ver lib/boot).
  const [live, setLive] = useState(false);

  useLayoutEffect(() => {
    claimBootCover();
  }, []);

  useEffect(() => {
    if (live) {
      hideBootCover({ force: true, fade: false });
      return;
    }
    const go = () => setLive(true);
    const inputs = ["touchstart", "pointerdown", "keydown", "wheel", "scroll"] as const;
    inputs.forEach((type) => window.addEventListener(type, go, { passive: true, once: true }));
    return () => inputs.forEach((type) => window.removeEventListener(type, go));
  }, [live]);

  useEffect(() => {
    if (halvesReady) return;
    const ready = () => setHalvesReady(true);
    const inputs = ["touchstart", "pointerdown", "keydown", "wheel", "scroll"] as const;
    inputs.forEach((type) => window.addEventListener(type, ready, { passive: true, once: true }));
    const idle = window.requestIdleCallback ? window.requestIdleCallback(ready, { timeout: 1500 }) : window.setTimeout(ready, 400);
    return () => {
      inputs.forEach((type) => window.removeEventListener(type, ready));
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, [halvesReady]);

  // metades acabaram de entrar: aplica o estado atual do rasgo nelas
  useEffect(() => {
    if (halvesReady) redrawRef.current();
  }, [halvesReady]);

  // Mede o palco antes da primeira pintura (a capa do HTML sai logo depois, por cima desta).
  useLayoutEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    // Altura estável: a maior altura da tela (100lvh), que não muda quando a barra de endereço do
    // celular aparece/some ao rolar. Com a altura visível (dvh), o papel era redesenhado a cada vez
    // que a barra mexia — travava a rolagem para cima no celular. A capa do HTML usa a mesma altura.
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100vh;height:calc(var(--vh, 1lvh) * 100)";
    el.appendChild(probe);
    const measure = () => {
      const w = el.clientWidth;
      const h = Math.max(el.clientHeight, probe.offsetHeight);
      if (!w || !h) return;
      // mesma largura: mantém o enquadramento da abertura (a arte não se mexe); girou: enquadra de novo
      setSize((cur) => {
        const fit = cur && cur.w === w ? Math.min(cur.fit, h) : h;
        return cur && cur.w === w && cur.h === h && cur.fit === fit ? cur : { w, h, fit };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(probe);
    return () => {
      ro.disconnect();
      probe.remove();
    };
  }, []);

  const portrait = size ? size.h >= size.w : window.matchMedia("(orientation: portrait)").matches;
  const L = portrait ? LAYOUT.portrait : LAYOUT.landscape;
  const geo = useMemo(() => (size ? geometry(size.w, size.h, L.frame, size.fit) : null), [size, L]);
  const tw = portrait ? TILE.portrait : TILE.landscape;
  const th = Math.round(tw * TILE_RATIO);
  const paperHref = assetUrl("/assets/branding/papel-embalagem.webp");

  // Formas fixas do rasgo (fibras e dobras já no desenho final: nada disso muda durante o scroll).
  const art = useMemo(() => {
    const shape = {
      top: pathOf([[line[0][0], -FAR] as Pt, [line[line.length - 1][0], -FAR] as Pt, ...[...line].reverse()]),
      bottom: pathOf([...line, [line[line.length - 1][0], FAR] as Pt, [line[0][0], FAR] as Pt]),
    };
    const core = (up: boolean) => {
      const widths = fibreWidths(line.length, 1, up ? 5 : 8);
      return pathOf(line.concat(line.map(([x, y], i) => [x, y + (up ? -widths[i] : widths[i])] as Pt).reverse()));
    };
    const curls = (side: "top" | "bottom") =>
      CURLS[side].map(([cx, hw, depth]) => {
        const up = side === "top";
        const pts = line.filter(([x]) => Math.abs(x - cx) <= hw);
        const back = pts.map(([x, y]) => {
          const k = Math.cos(((x - cx) / hw) * (Math.PI / 2));
          return [x + (up ? 6 : -6) * k, y + (up ? 1 : -1) * depth * k * k] as Pt;
        });
        return pathOf(pts.concat(back.reverse()));
      });
    return { edge: pathOf(line, false), shape, core: { top: core(true), bottom: core(false) }, curls: { top: curls("top"), bottom: curls("bottom") } };
  }, [line]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !geo) return;
    let raf = 0;
    let target = 0;
    let q = 0;
    // só escreve no DOM o que mudou (e só em elementos que já existem: as metades entram depois)
    const last: Record<string, string> = {};
    const write = (key: string, value: string, el: Element | null, apply: (v: string) => void) => {
      if (!el || last[key] === value) return;
      last[key] = value;
      apply(value);
    };

    // Por quadro só mudam transform/opacity de camadas prontas (a placa de vídeo compõe, nada é redesenhado).
    // Exceção: a rachadura, que cresce numa camada fina e transparente, só no começo do rasgo.
    const draw = () => {
      const st = stages(q);
      // papel já saiu da tela: esconde tudo (nada para compor durante o vídeo)
      write("layer", q >= 0.999 ? "hidden" : "visible", layerRef.current, (v) => (layerRef.current!.style.visibility = v));
      const shake = Math.sin(q * 900) * 6 * st.shake * geo.s;
      write("shake", `translate3d(${shake.toFixed(2)}px,${(shake * 0.4).toFixed(2)}px,0)`, shakeRef.current, (v) => (shakeRef.current!.style.transform = v));
      // a folha inteira só sai quando as metades já estão prontas embaixo dela
      const halvesIn = !!halfRefs.top.current && !!halfRefs.bottom.current;
      write("whole", st.open > 0 && halvesIn ? "hidden" : "visible", wholeRef.current, (v) => (wholeRef.current!.style.visibility = v));
      (["top", "bottom"] as const).forEach((side) => {
        const up = side === "top";
        const dx = (up ? -10 : 12) * st.open * geo.s;
        // abre um pouco (aparece o palco) e depois as metades aceleram para fora da tela
        const dy = (up ? -1 : 1) * (70 * st.open + L.travel * st.leave) * geo.s;
        const rot = (up ? -2.6 : 2.1) * st.open;
        const half = halfRefs[side].current;
        const shadow = shadowRefs[side].current;
        write(side, `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg)`, half, (v) => (half!.style.transform = v));
        write(side + "-shadow", Math.min(1, st.open * 3).toFixed(3), shadow, (v) => (shadow!.style.opacity = v));
      });
      write("hint", (1 - st.crack).toFixed(3), hintRef.current, (v) => hintRef.current!.setAttribute("opacity", v));
      const reach = st.crack * 620;
      const crack = st.crack > 0 && st.open < 0.15 ? line.filter(([x]) => Math.abs(x - CX) <= reach) : [];
      write("crack", crack.length > 1 ? pathOf(crack, false) : "", crackRef.current, (v) => crackRef.current!.setAttribute("d", v));
      write("crack-o", Math.max(0, 1 - st.open / 0.15).toFixed(3), crackRef.current, (v) => crackRef.current!.setAttribute("opacity", v));
    };
    redrawRef.current = draw;

    const step = () => {
      raf = 0;
      q += (target - q) * 0.16;
      if (Math.abs(target - q) < 0.0005) q = target;
      draw();
      if (q !== target) raf = requestAnimationFrame(step);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const st = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: () => `+=${Math.max(1, (trigger.offsetHeight - window.innerHeight) * portion)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        target = self.progress;
        kick();
      },
      onRefresh: (self) => {
        target = self.progress;
        kick();
      },
    });
    target = q = st.progress;
    draw();
    return () => {
      st.kill();
      if (raf) cancelAnimationFrame(raf);
      redrawRef.current = () => {};
    };
    // halfRefs/shadowRefs são refs estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, L, line, portion, triggerRef]);

  const pattern = (id: string) => (
    <defs>
      {/* 2×2 com espelhamento: as bordas sempre se encontram iguais, então o ladrilho repete sem emenda */}
      <pattern id={id} patternUnits="userSpaceOnUse" x={CX - tw / 2} y={CY - th / 2} width={tw * 2} height={th * 2}>
        <image href={paperHref} width={tw} height={th} preserveAspectRatio="none" />
        <image href={paperHref} width={tw} height={th} preserveAspectRatio="none" transform={`translate(${tw * 2} 0) scale(-1 1)`} />
        <image href={paperHref} width={tw} height={th} preserveAspectRatio="none" transform={`translate(0 ${th * 2}) scale(1 -1)`} />
        <image href={paperHref} width={tw} height={th} preserveAspectRatio="none" transform={`translate(${tw * 2} ${th * 2}) scale(-1 -1)`} />
      </pattern>
    </defs>
  );

  const sheet = (patternId: string) => (
    <>
      <rect x={-FAR} y={-FAR} width={FAR * 2 + 1000} height={FAR * 2} fill={PAPER.base} />
      <rect x={-FAR} y={-FAR} width={FAR * 2 + 1000} height={FAR * 2} fill={`url(#${patternId})`} />
      <text x={CX} y={portrait ? 120 : 150} textAnchor="middle" fill={PAPER.ink} style={{ font: `700 ${portrait ? 54 : 34}px "Archivo Variable", Archivo, Arial, sans-serif`, letterSpacing: "0.02em" }}>
        {tagline}
      </text>
      <text
        x={CX}
        y={404}
        textAnchor="middle"
        textLength={880}
        lengthAdjust="spacingAndGlyphs"
        fill={PAPER.red}
        style={{ fontFamily: '"Anton", Impact, "Arial Narrow Bold", sans-serif', fontSize: 250 }}
      >
        {word}
      </text>
    </>
  );

  const box = geo ? { left: -geo.m, top: -geo.m, width: geo.w + 2 * geo.m, height: geo.h + 2 * geo.m, transformOrigin: `${geo.ox}px ${geo.oy}px` } : undefined;
  const svg = (children: ReactNode) =>
    geo && (
      <svg viewBox={geo.viewBox} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 block h-full w-full max-w-none">
        {children}
      </svg>
    );

  const half = (side: "top" | "bottom") => {
    const up = side === "top";
    return (
      // desenhada uma vez; embaixo da folha inteira até o rasgo abrir (já pronta na hora de aparecer)
      <div ref={halfRefs[side]} className="absolute will-change-transform" style={box}>
        <div ref={shadowRefs[side]} className="absolute inset-0 opacity-0 will-change-[opacity]">
          {svg(
            <g transform={`translate(0 ${up ? 12 : -12})`} fill="none" stroke="#000">
              <path d={art.edge} strokeWidth={46} strokeOpacity={0.1} />
              <path d={art.edge} strokeWidth={26} strokeOpacity={0.16} />
              <path d={art.edge} strokeWidth={10} strokeOpacity={0.24} />
            </g>,
          )}
        </div>
        {svg(
          <>
            {pattern(`vv-paper-${side}`)}
            <defs>
              <clipPath id={`vv-tear-${side}`}>
                <path d={art.shape[side]} />
              </clipPath>
              <linearGradient id={`vv-curl-${side}`} x1="0" y1={up ? 0 : 1} x2="0" y2={up ? 1 : 0}>
                <stop offset="0" stopColor="#fffaf2" />
                <stop offset="1" stopColor="#cdbba6" />
              </linearGradient>
            </defs>
            <g clipPath={`url(#vv-tear-${side})`}>{sheet(`vv-paper-${side}`)}</g>
            <path d={art.core[side]} fill={PAPER.core} />
            <g stroke={PAPER.core} strokeWidth={1} fill={`url(#vv-curl-${side})`}>
              {art.curls[side].map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </>,
        )}
      </div>
    );
  };

  return (
    <div
      ref={layerRef}
      role="img"
      aria-label="Papel de embalagem com desenhos de lanches, a frase Bateu a fome? e a palavra Vick's, que rasga ao rolar e revela o hambúrguer."
      data-tear-overlay
      data-ready={geo ? "true" : undefined}
      className="pointer-events-none absolute inset-0 z-20"
      style={live ? undefined : { opacity: 0 }}
    >
      {geo && (
        <div ref={shakeRef} className="absolute inset-0 will-change-transform">
          {halvesReady && half("top")}
          {halvesReady && half("bottom")}
          {/* folha inteira por cima das metades enquanto o papel não abriu */}
          <div ref={wholeRef} className="absolute will-change-transform" style={box}>
            {svg(
              <>
                {pattern("vv-paper-whole")}
                {sheet("vv-paper-whole")}
              </>,
            )}
          </div>
          {/* rachadura + "Role para abrir": camada fina, a única que muda de desenho (só no começo) */}
          <div className="absolute will-change-transform" style={box}>
            {svg(
              <>
                <path ref={crackRef} fill="none" stroke="#3a2212" strokeWidth={2.4} strokeLinejoin="bevel" />
                <text
                  ref={hintRef}
                  x={CX}
                  y={portrait ? 580 : 488}
                  textAnchor="middle"
                  fill={PAPER.ink}
                  style={{ font: `600 ${portrait ? 40 : 20}px "Archivo Variable", Archivo, Arial, sans-serif`, letterSpacing: "0.04em" }}
                >
                  Role para abrir
                </text>
              </>,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
