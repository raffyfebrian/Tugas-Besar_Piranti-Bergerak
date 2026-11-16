import { useEffect, useRef } from 'react';

import type { Order } from '../types';
import { showStatusNotification } from '../utils/statusNotify';

/**
 * Memantau satu pesanan dan memanggil `onStatusChange` ketika statusnya berubah
 * setelah komponen terpasang. Perubahan pertama (mount) tidak dihitung agar
 * tamu tidak menerima notifikasi untuk status yang sudah ada.
 *
 * `onStatusChange` sebaiknya stabil (mis. dibungkus useCallback) supaya efek
 * tidak dipasang ulang setiap render.
 */
export const useOrderStatusNotice = (
  order: Order | undefined,
  onStatusChange: (next: Order, previous: Order) => void,
): void => {
  const previousRef = useRef<Order | null>(null);

  useEffect(() => {
    if (!order) {
      previousRef.current = null;
      return;
    }

    const previous = previousRef.current;
    previousRef.current = order;

    if (!previous || previous.id !== order.id || previous.status === order.status) return;

    onStatusChange(order, previous);
    void showStatusNotification(order);
  }, [order, onStatusChange]);
};
