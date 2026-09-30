import { cn } from "@/lib/utils";
import { assetUrl, assetSrcSet } from "@/lib/asset-url";

type LogoProps = { className?: string; alt?: string; size?: 320 | 640 | 1200; eager?: boolean; sizes?: string };

/** Logo oficial (fundo preto convertido em transparência). Proporção 1760×1060. */
export function Logo({ className, alt = "Villa Vick's", size = 320, eager = false, sizes }: LogoProps) {
  return (
    <img
      src={assetUrl(`/assets/branding/logo-${size}.png`)}
      // descritores de largura + sizes: celular 3× pega a versão de 640 px, não a de 1200 px
      srcSet={assetSrcSet(size === 320 ? "/assets/branding/logo-320.png 320w, /assets/branding/logo-640.png 640w" : "/assets/branding/logo-640.png 640w, /assets/branding/logo-1200.png 1200w")}
      sizes={sizes ?? (size === 320 ? "(min-width: 1024px) 7rem, 6rem" : "(orientation: landscape) min(36vw, 30rem), 200px")}
      width={1760}
      height={1060}
      alt={alt}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      className={cn("block h-auto select-none", className)}
      draggable={false}
    />
  );
}
