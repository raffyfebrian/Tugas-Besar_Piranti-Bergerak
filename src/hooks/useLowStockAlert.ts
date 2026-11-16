import { useEffect, useRef } from 'react';

import type { StockItem } from '../types';
import { lowStockItems } from '../utils/recipes';

/**
 * Memanggil `onAlert` ketika ada bahan yang baru melewati batas minimum.
 * Bahan yang sudah menipis saat halaman pertama dibuka tidak dianggap baru,
 * sehingga staf tidak dibanjiri peringatan lama setiap berpindah halaman.
 */
export const useLowStockAlert = (stock: StockItem[], onAlert: (items: StockItem[]) => void): void => {
  const seenRef = useRef<Set<string> | null>(null);
  const handlerRef = useRef(onAlert);

  useEffect(() => {
    handlerRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    const low = lowStockItems(stock);

    if (!seenRef.current) {
      seenRef.current = new Set(low.map((item) => item.id));
      return;
    }

    const seen = seenRef.current;
    const fresh = low.filter((item) => !seen.has(item.id));

    [...seen].forEach((id) => {
      if (!low.some((item) => item.id === id)) seen.delete(id);
    });
    low.forEach((item) => seen.add(item.id));

    if (fresh.length) handlerRef.current(fresh);
  }, [stock]);
};
