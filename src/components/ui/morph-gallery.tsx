import * as React from "react";

/**
 * Morph Gallery — galeria em que uma foto se dissolve na outra através de ruído,
 * em vez de cortar ou fazer cross-fade.
 *
 * A transição é um único shader sobre duas texturas. Um campo de ruído fbm dá a cada pixel
 * um limiar e o progresso varre esses limiares, então a foto que sai se desfaz em farrapos.
 * O limiar é enviesado pelo brilho da foto que ENTRA: as áreas claras dela "queimam" primeiro.
 *
 * Adaptações para a Villa Vick's (componente original: morph-gallery do 21st.dev):
 * - texturas carregadas sob demanda (a atual primeiro, depois as vizinhas), não todas de uma vez;
 * - só desenha enquanto há transição (parada, não gasta bateria) e só inicia perto da tela;
 * - `resolveTexture`: aberto direto do disco (file://), imagem local não pode virar textura
 *   WebGL; o site entrega a mesma foto como data URI;
 * - sem WebGL ou com textura recusada: cai para um cross-fade simples com <img>;
 * - textos em português e `children` para sobrepor conteúdo ao palco.
 */

export type MorphItem = {
  /** Foto (também usada no modo sem WebGL). */
  src: string;
  alt?: string;
};

export type MorphGalleryProps = {
  items: MorphItem[];
  /** Precisa ser um tamanho definido: o canvas ocupa esta caixa. */
  height?: string;
  /** Milissegundos de dissolução. */
  duration?: number;
  /** Frequência do fbm. Maior = farrapos mais finos. */
  noiseScale?: number;
  /** Largura da frente de dissolução. 0 = borda dura. */
  edge?: number;
  /** Quanto as fotos deslizam uma contra a outra durante a transição. */
  drift?: number;
  /** Dá a volta nas pontas. */
  loop?: boolean;
  arrows?: boolean;
  /** Índice controlado. Omitir para não controlado. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** URL usada como textura (padrão: `item.src`). */
  resolveTexture?: (item: MorphItem, index: number) => Promise<string>;
  /** Índices a pré-carregar depois da foto atual (padrão: anterior e próxima). */
  prefetch?: (active: number) => number[];
  label?: string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

/** Dá a volta nas pontas com loop; senão, trava nelas. */
export const wrapIndex = (i: number, n: number, loop: boolean): number => {
  if (n <= 0) return 0;
  return loop ? ((i % n) + n) % n : Math.min(Math.max(i, 0), n - 1);
};

/**
 * Cúbica de saída: a dissolução começa NA HORA do toque e assenta devagar no fim.
 * (A quíntica in-out original quase não mudava nada no primeiro terço: parecia que a foto demorava.)
 */
export const easeOutCubic = (t: number): number => {
  const x = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - x) ** 3;
};

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform float u_progress;
uniform vec2 u_resolution;
uniform float u_fromAspect;
uniform float u_toAspect;
uniform float u_scale;
uniform float u_direction;
uniform float u_edge;
uniform float u_drift;

varying vec2 v_uv;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
   -0.577350269189626,
    0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
  );
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 v) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(v);
    v *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// O deslize empurra as coordenadas para fora da foto; refletir mantém imagem de verdade ali
// (MIRRORED_REPEAT não é permitido em texturas que não são potência de 2).
vec2 mirror(vec2 uv) {
  return 1.0 - abs(1.0 - mod(uv, 2.0));
}

vec2 coverUV(vec2 uv, float imgAspect) {
  float canvasAspect = u_resolution.x / u_resolution.y;
  vec2 scale = (canvasAspect > imgAspect)
    ? vec2(1.0, imgAspect / canvasAspect)
    : vec2(canvasAspect / imgAspect, 1.0);
  return mirror((uv - 0.5) * scale + 0.5);
}

void main() {
  float adjusted = u_progress * (1.0 + 2.0 * u_edge) - u_edge;

  float noise = fbm(v_uv * u_scale + vec2(0.0, u_progress * u_direction)) * 0.5 + 0.5;
  noise = smoothstep(
    0.0,
    2.0,
    length(texture2D(u_to, coverUV(v_uv, u_toAspect)).rgb) + noise
  );

  float mixFactor = 1.0 - smoothstep(adjusted - u_edge, adjusted + u_edge, noise);

  vec2 fromUV = coverUV(
    v_uv + vec2(0.0, noise * u_progress * u_drift * u_direction),
    u_fromAspect
  );
  vec2 toUV = coverUV(
    v_uv + vec2(0.0, noise * (1.0 - u_progress) * -0.5 * u_drift * u_direction),
    u_toAspect
  );

  gl_FragColor = mix(texture2D(u_from, fromUV), texture2D(u_to, toUV), mixFactor);
}
`;

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("shader compile failed: " + log);
  }
  return shader;
};

const link = (gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) => {
  const vert = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("program link failed: " + log);
  }
  return program;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Sem isso o upload da textura falha; com isso, um servidor sem CORS falha AQUI — e dá para cair no modo simples.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    // decode() fora da thread principal: o upload da textura não trava a rolagem decodificando a foto
    img.onload = () => (img.decode ? img.decode().catch(() => undefined) : Promise.resolve()).then(() => resolve(img));
    img.onerror = () => reject(new Error("could not load " + src));
    img.src = src;
  });

const chevron = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={d} />
  </svg>
);

export default function MorphGallery({
  items,
  height = "100%",
  duration = 900,
  noiseScale = 3.5,
  edge = 0.15,
  drift = 0.5,
  loop = true,
  arrows = true,
  index,
  defaultIndex = 0,
  onIndexChange,
  resolveTexture,
  prefetch,
  label = "Galeria de fotos",
  prevLabel = "Foto anterior",
  nextLabel = "Próxima foto",
  className = "",
  children,
}: MorphGalleryProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [uncontrolled, setUncontrolled] = React.useState(() => wrapIndex(defaultIndex, items.length, loop));
  const active = index === undefined ? uncontrolled : wrapIndex(index, items.length, loop);

  const [failed, setFailed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [generation, setGeneration] = React.useState(0);
  const [near, setNear] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // O WebGL só sobe quando a galeria chega perto da tela.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    // Sobe o WebGL só com a galeria à vista e a rolagem PARADA: compilar o shader e enviar a foto
    // no meio de uma rolagem dava um tranco (no celular, logo depois da intro). Até lá a foto comum
    // já ocupa o palco, então ninguém percebe a espera.
    let quiet = 0;
    let idle = 0;
    const arm = () => {
      window.removeEventListener("scroll", waitQuiet);
      setNear(true);
    };
    const waitQuiet = () => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        idle = window.requestIdleCallback ? window.requestIdleCallback(arm, { timeout: 1000 }) : window.setTimeout(arm, 50);
      }, 220);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          window.addEventListener("scroll", waitQuiet, { passive: true });
          waitQuiet();
        }
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", waitQuiet);
      window.clearTimeout(quiet);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
    };
  }, []);

  const go = React.useCallback(
    (next: number) => {
      const wrapped = wrapIndex(next, items.length, loop);
      if (index === undefined) setUncontrolled(wrapped);
      onIndexChange?.(wrapped);
    },
    [index, items.length, loop, onIndexChange],
  );

  // O loop lê os valores ao vivo por refs: ajustar a dissolução nunca derruba o contexto GL.
  const tuning = React.useRef({ duration, noiseScale, edge, drift, reduced });
  tuning.current = { duration, noiseScale, edge, drift, reduced };
  const activeRef = React.useRef(active);
  activeRef.current = active;
  const resolveRef = React.useRef(resolveTexture);
  resolveRef.current = resolveTexture;
  const prefetchRef = React.useRef(prefetch);
  prefetchRef.current = prefetch;
  const engine = React.useRef<{ show: (i: number) => void } | null>(null);

  React.useEffect(() => {
    engine.current?.show(active);
  }, [active]);

  const sources = items.map((i) => i.src).join("\n");

  React.useEffect(() => {
    if (!near || failed) return;
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const gl =
      canvas.getContext("webgl", { alpha: false, antialias: false }) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      setFailed(true);
      return;
    }

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const textures: (WebGLTexture | null)[] = items.map(() => null);
    const aspects: number[] = items.map(() => 1);
    const loading = new Map<number, Promise<boolean>>();
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    let raf = 0;
    let disposed = false;
    let shownReady = false;

    // Estado da dissolução, no loop e não no React: muda a cada quadro.
    let from = activeRef.current;
    let to = from;
    let target = from;
    let progress = 1;
    let startedAt = 0;
    let direction = 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w === 0 || h === 0 || (canvas.width === w && canvas.height === h)) return false;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      return true;
    };

    const draw = () => {
      const t = tuning.current;

      // Nova foto pedida e já carregada: começa a transição a partir do que está na tela.
      if (target !== to && textures[target]) {
        const visible = progress < 0.5 ? from : to;
        from = visible === target ? to : visible;
        to = target;
        progress = 0;
        startedAt = performance.now();
        const n = items.length;
        const forward = loop ? ((to - from + n) % n) * 2 <= n : to > from;
        direction = forward ? 1 : -1;
      }

      if (progress < 1) {
        const span = t.reduced ? 0 : Math.max(t.duration, 1);
        const elapsed = performance.now() - startedAt;
        progress = span === 0 ? 1 : easeOutCubic(Math.min(elapsed / span, 1));
      }

      const toTex = textures[to];
      const fromTex = textures[from] ?? toTex;
      if (!fromTex || !toTex) return;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fromTex);
      gl.uniform1i(uniforms.from, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, toTex);
      gl.uniform1i(uniforms.to, 1);

      gl.uniform1f(uniforms.progress, progress);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.fromAspect, aspects[from] ?? 1);
      gl.uniform1f(uniforms.toAspect, aspects[to] ?? 1);
      gl.uniform1f(uniforms.scale, t.noiseScale);
      gl.uniform1f(uniforms.direction, direction);
      gl.uniform1f(uniforms.edge, Math.max(t.edge, 0.001));
      gl.uniform1f(uniforms.drift, t.drift);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!shownReady) {
        shownReady = true;
        setReady(true);
      }
    };

    // Desenha sob demanda: um quadro por pedido, e em sequência só enquanto a dissolução corre.
    const frame = () => {
      raf = 0;
      if (disposed) return;
      resize();
      draw();
      if (progress < 1) schedule();
    };
    const schedule = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    };

    const ensure = (i: number): Promise<boolean> => {
      if (textures[i]) return Promise.resolve(true);
      const pending = loading.get(i);
      if (pending) return pending;
      const item = items[i];
      const p = (resolveRef.current ? resolveRef.current(item, i) : Promise.resolve(item.src))
        .then(loadImage)
        .then((img) => {
          if (disposed) return false;
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          // Fotos não são potência de 2: em WebGL1 só vale clamp + linear (o par errado desenha preto, sem erro).
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          textures[i] = tex;
          aspects[i] = img.naturalWidth / Math.max(img.naturalHeight, 1);
          schedule();
          return true;
        })
        .catch(() => {
          // Textura recusada (CORS) ou foto quebrada: melhor a galeria simples do que a foto errada.
          if (!disposed) setFailed(true);
          return false;
        });
      loading.set(i, p);
      return p;
    };

    // Depois da atual, as próximas prováveis — uma por vez, sem disputar banda com o resto da página.
    const warm = (i: number) => {
      const n = items.length;
      const list = prefetchRef.current?.(i) ?? [wrapIndex(i + 1, n, loop), wrapIndex(i - 1, n, loop)];
      list.reduce<Promise<unknown>>((chain, j) => chain.then(() => (disposed ? false : ensure(j))), Promise.resolve());
    };

    const show = (i: number) => {
      target = i;
      ensure(i).then((ok) => {
        if (ok && !disposed) warm(i);
      });
      schedule();
    };

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // Contexto restaurado vem vazio: reconstrói tudo.
    const onRestored = () => setGeneration((g) => g + 1);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const observer = new ResizeObserver(() => schedule());
    observer.observe(canvas);

    try {
      program = link(gl, VERT, FRAG);
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const name of ["from", "to", "progress", "resolution", "fromAspect", "toAspect", "scale", "direction", "edge", "drift"]) {
        uniforms[name] = gl.getUniformLocation(program, "u_" + name);
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      engine.current = { show };
      show(activeRef.current);
    } catch {
      // Sem WebGL ou driver que recusou o programa: mostra as fotos sem o morph.
      setFailed(true);
    }

    return () => {
      disposed = true;
      engine.current = null;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      for (const tex of textures) if (tex) gl.deleteTexture(tex);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      textures.fill(null);
    };
    // `active` é lido uma vez (pela ref) para o primeiro quadro; as trocas chegam por engine.show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, failed, sources, generation, items.length, loop]);

  // Modo simples (sem WebGL): as duas últimas fotos empilhadas, a nova entrando por opacidade.
  const [layers, setLayers] = React.useState<number[]>([active]);
  React.useEffect(() => {
    setLayers((l) => (l[l.length - 1] === active ? l : [l[l.length - 1], active]));
  }, [active]);

  // ---- toque e teclado ----------------------------------------------------
  const swipe = React.useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const startX = swipe.current;
    swipe.current = null;
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 48) go(active + (dx < 0 ? 1 : -1));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    }
  };

  const atStart = !loop && active === 0;
  const atEnd = !loop && active === items.length - 1;
  const current = items[active];

  const arrowClass =
    "flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md " +
    "transition-[background-color,transform] duration-200 hover:bg-black/70 active:scale-95 " +
    "disabled:pointer-events-none disabled:opacity-25";

  return (
    <div
      ref={rootRef}
      className={"relative w-full touch-pan-y overflow-hidden bg-black select-none " + className}
      style={{ height }}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      {failed ? (
        layers.map((i, k) => (
          <img
            key={items[i].src}
            src={items[i].src}
            alt=""
            decoding="async"
            draggable={false}
            className={
              "absolute inset-0 block h-full w-full object-cover " +
              (k === layers.length - 1 && layers.length > 1 ? "animate-in fade-in duration-700 motion-reduce:animate-none" : "")
            }
            style={{ maxWidth: "none" }}
          />
        ))
      ) : (
        <>
          {/* Enquanto a primeira textura não sobe, a foto comum segura o lugar (sem retângulo preto).
              O canvas entra de uma vez, já desenhado com a mesma foto: um fade aqui mostrava o fundo
              escuro por um instante (a foto "piscava" quando a rolagem parava). */}
          {!ready && current && (
            <img src={current.src} alt="" data-static decoding="async" draggable={false} className="absolute inset-0 block h-full w-full object-cover" style={{ maxWidth: "none" }} />
          )}
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true" />
        </>
      )}

      {children}

      {arrows && items.length > 1 && (
        <div className="absolute right-3 bottom-3 z-10 flex gap-2 sm:right-4 sm:bottom-4">
          <button type="button" className={arrowClass} onClick={() => go(active - 1)} disabled={atStart} aria-label={prevLabel}>
            {chevron("15 18 9 12 15 6")}
          </button>
          <button type="button" className={arrowClass} onClick={() => go(active + 1)} disabled={atEnd} aria-label={nextLabel}>
            {chevron("9 18 15 12 9 6")}
          </button>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {current?.alt ?? ""}
      </span>
    </div>
  );
}
