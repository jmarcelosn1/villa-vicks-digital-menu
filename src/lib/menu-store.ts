import { useSyncExternalStore } from "react";
import type { MenuCategoryId } from "@/data/site";

/**
 * Categoria aberta no cardápio (Burger, Pizza ou Grill), compartilhada entre o cardápio,
 * o menu do topo e os links #burger / #pizza / #grill.
 */
let current: MenuCategoryId = "burger";
const listeners = new Set<() => void>();

export const menuStore = {
  get: () => current,
  set(next: MenuCategoryId) {
    if (next === current) return;
    current = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const isMenuCategory = (id: string): id is MenuCategoryId => id === "burger" || id === "pizza" || id === "grill";

export function useMenuCategory() {
  return useSyncExternalStore(menuStore.subscribe, menuStore.get, menuStore.get);
}
