import { ASSETS, type AssetKey } from "@/data/assets.generated";
import { assetUrl, assetSrcSet } from "@/lib/asset-url";

type PictureProps = {
  asset: AssetKey;
  alt: string;
  /** Atributo sizes do srcset — descreve a largura exibida em cada breakpoint. */
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

/** Imagem responsiva: AVIF → WebP → JPG, com dimensões intrínsecas (sem layout shift). */
export function Picture({ asset, alt, sizes, className, imgClassName, priority = false }: PictureProps) {
  const a = ASSETS[asset];
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={assetSrcSet(a.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={assetSrcSet(a.webp)} sizes={sizes} />
      <img
        src={assetUrl(a.src)}
        alt={alt}
        width={a.width}
        height={a.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={imgClassName}
      />
    </picture>
  );
}
