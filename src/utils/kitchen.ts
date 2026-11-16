import type { Order, PrepItem } from '../types';

/** Daftar item pesanan yang sudah dipetakan ke status timer dapur. */
export const prepItemsFor = (order: Order): PrepItem[] =>
  order.items.map((item) => order.prep?.items.find((entry) => entry.menuId === item.menuId) ?? { menuId: item.menuId });

export interface PrepStats {
  total: number;
  started: number;
  finished: number;
  remaining: number;
  allFinished: boolean;
}

/** Ringkasan progres masak satu tiket. */
export const prepStats = (order: Order): PrepStats => {
  const items = prepItemsFor(order);
  const started = items.filter((item) => Boolean(item.startedAt)).length;
  const finished = items.filter((item) => Boolean(item.finishedAt)).length;
  return {
    total: items.length,
    started,
    finished,
    remaining: items.length - finished,
    allFinished: items.length > 0 && finished === items.length,
  };
};

/** Detik berjalan sejak item mulai dimasak; 0 bila belum dimulai. */
export const prepSeconds = (item: PrepItem | undefined, now: number): number => {
  if (!item?.startedAt) return 0;
  const started = Date.parse(item.startedAt);
  if (Number.isNaN(started)) return 0;
  const end = item.finishedAt ? Date.parse(item.finishedAt) : now;
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - started) / 1000));
};

/** Format durasi menjadi mm:ss agar mudah dibaca saat memasak. */
export const formatPrepClock = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};
