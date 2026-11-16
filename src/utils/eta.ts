import type { Order } from '../types';

/** Waktu dasar menyiapkan satu tiket pesanan (menit). */
export const BASE_PREP_MINUTES = 6;
/** Tambahan waktu untuk setiap item setelah item pertama. */
export const PER_ITEM_MINUTES = 2;
/** Batas atas waktu penyiapan satu pesanan agar estimasi tetap masuk akal. */
export const MAX_PREP_MINUTES = 28;
/** Perkiraan waktu antar dari dapur ke kamar. */
export const DELIVERY_MINUTES = 4;
/** Estimasi tidak pernah lebih cepat dari ini saat pesanan sudah diproses. */
export const MIN_REMAINING_MINUTES = 1;
/** Batas total estimasi supaya antrean panjang tidak menghasilkan angka ekstrem. */
export const MAX_TOTAL_MINUTES = 45;

export interface OrderEta {
  /** Sisa waktu dalam menit (dibulatkan). */
  minutes: number;
  /** Perkiraan jam pesanan tiba di kamar. */
  readyAt: Date;
}

const isFinished = (order: Order): boolean => order.status === 'selesai' || order.status === 'dibatalkan';

const queuedForKitchen = (order: Order): boolean => order.status === 'menunggu_validasi' || order.status === 'diproses';

const minutesSince = (iso: string, now: number): number => {
  const value = Date.parse(iso);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, (now - value) / 60000);
};

/** Waktu pesanan mulai dikerjakan dapur; pesanan yang belum divalidasi memakai waktu dibuat. */
export const startedProcessingAt = (order: Order): string =>
  order.timeline.find((entry) => entry.status === 'diproses')?.at ?? order.createdAt;

/** Waktu menyiapkan satu pesanan berdasarkan jumlah item, dibatasi MAX_PREP_MINUTES. */
export const ticketMinutes = (order: Order): number => {
  const itemCount = order.items.reduce((total, item) => total + item.qty, 0);
  const extraItems = Math.max(0, itemCount - 1);
  return Math.min(MAX_PREP_MINUTES, BASE_PREP_MINUTES + extraItems * PER_ITEM_MINUTES);
};

const remainingPrepMinutes = (order: Order, now: number): number => {
  const full = ticketMinutes(order);
  if (order.status !== 'diproses') return full;
  const elapsed = minutesSince(startedProcessingAt(order), now);
  return Math.max(MIN_REMAINING_MINUTES, full - elapsed);
};

/**
 * Estimasi waktu pesanan tiba di kamar.
 *
 * Perhitungan memakai sisa waktu tiket sendiri + sisa waktu pesanan lain yang
 * masih berada di antrean dapur (dan dibuat lebih dulu) + waktu antar. Status
 * yang belum masuk dapur atau sudah final tidak diberi estimasi.
 */
export const estimateOrderEta = (order: Order, orders: Order[], now: number = Date.now()): OrderEta | null => {
  if (isFinished(order) || order.status === 'menunggu_pembayaran') return null;

  const toEta = (minutes: number): OrderEta => {
    const rounded = Math.max(MIN_REMAINING_MINUTES, Math.round(minutes));
    return { minutes: rounded, readyAt: new Date(now + rounded * 60000) };
  };

  if (order.status === 'siap_diantar') return toEta(DELIVERY_MINUTES);
  if (order.status === 'diantar') return toEta(Math.max(MIN_REMAINING_MINUTES, Math.round(DELIVERY_MINUTES / 2)));

  const ownStart = Date.parse(startedProcessingAt(order));
  const queueMinutes = orders
    .filter((other) => other.id !== order.id && queuedForKitchen(other))
    .filter((other) => {
      const otherStart = Date.parse(startedProcessingAt(other));
      if (Number.isNaN(otherStart) || Number.isNaN(ownStart)) return false;
      return otherStart < ownStart;
    })
    .reduce((total, other) => total + remainingPrepMinutes(other, now), 0);

  const totalMinutes = remainingPrepMinutes(order, now) + queueMinutes + DELIVERY_MINUTES;
  return toEta(Math.min(MAX_TOTAL_MINUTES, totalMinutes));
};
