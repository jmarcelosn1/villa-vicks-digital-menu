import { SITE } from "@/data/site";
import { assetUrl } from "@/lib/asset-url";

/**
 * Mapa da localização: uma imagem (scripts/build-map.mjs, dados © OpenStreetMap) no lugar do Google Maps
 * embutido. O Google carregava ~1 MB de scripts, demorava no 4G, ficava um quadro cinza e, escurecido por
 * filtro, ficava feio. A imagem tem ~50 KB, aparece na hora, funciona sem internet e já vem no tom do site.
 * Tocar no mapa abre a rota no Google Maps (o botão "Como chegar" do cartão faz o mesmo).
 *
 * O pino fica sobre o ponto exato: object-position = posição do pino na imagem (30% no retrato,
 * 44% na paisagem), então o ponto continua no lugar qualquer que seja o recorte do object-cover.
 */
export function MapEmbed() {
  return (
    <a
      href={SITE.links.maps}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir a localização da Villa Vick's no Google Maps"
      className="group absolute inset-0 block"
    >
      <picture>
        <source media="(min-width: 640px)" type="image/webp" srcSet={assetUrl("/assets/mapa/mapa-paisagem.webp")} />
        <img
          src={assetUrl("/assets/mapa/mapa-retrato.webp")}
          alt="Mapa: Villa Vick's na Vila Food, Arena Jesus, perto da BR-222, em Itapecuru-Mirim"
          width={900}
          height={1250}
          loading="lazy"
          decoding="async"
          data-static
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%] transition-transform duration-700 ease-out group-hover:scale-[1.02] sm:object-[50%_44%]"
        />
      </picture>

      {/* Pino */}
      <span aria-hidden="true" className="absolute top-[30%] left-1/2 sm:top-[44%]">
        <span className="map-pulse absolute top-0 left-0 size-16 rounded-full bg-vred/30" />
        <svg viewBox="0 0 32 44" className="absolute bottom-0 left-0 w-9 -translate-x-1/2 drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)]">
          <path d="M16 0C7.2 0 0 7 0 15.8 0 27.6 16 44 16 44s16-16.4 16-28.2C32 7 24.8 0 16 0Z" fill="#d7261e" />
          <circle cx="16" cy="15.5" r="6" fill="#fff4ea" />
        </svg>
        <span className="absolute bottom-14 left-0 -translate-x-1/2 rounded-full bg-ink/90 px-3 py-1 text-[0.8rem] font-semibold whitespace-nowrap text-bone shadow-lg">
          Villa Vick's
        </span>
      </span>

      <span className="absolute top-2 right-3 text-[0.65rem] text-white/40">© OpenStreetMap</span>
    </a>
  );
}
