import type { MenuItem } from '../types';

/**
 * Memilih menu untuk karusel 3D: satu item pertama dari setiap kategori agar
 * variasi rasa tetap terwakili, lalu dilengkapi item lain sampai jumlah penuh.
 */
export const pickSignatureItems = (menu: MenuItem[], count = 6): MenuItem[] => {
  const available = menu.filter((item) => item.available);
  const picks: MenuItem[] = [];
  const seenCategories = new Set<string>();

  available.forEach((item) => {
    if (picks.length >= count) return;
    if (seenCategories.has(item.category)) return;
    seenCategories.add(item.category);
    picks.push(item);
  });

  for (const item of available) {
    if (picks.length >= count) break;
    if (!picks.includes(item)) picks.push(item);
  }

  return picks.slice(0, count);
};
