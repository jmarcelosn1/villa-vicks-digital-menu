import { SITE, type MenuCategoryId } from "@/data/site";
import { useMenuCategory } from "@/lib/menu-store";

/** Conversa no WhatsApp da cozinha, com a mensagem "vim pelo site" já escrita. */
export const whatsappLink = (cat: MenuCategoryId) => `https://wa.me/${SITE.whatsapp[cat]}?text=${encodeURIComponent(SITE.whatsappText)}`;

/** Link do WhatsApp da cozinha aberta no cardápio (Burger, Pizza ou Grill). */
export function useWhatsAppLink() {
  return whatsappLink(useMenuCategory());
}
