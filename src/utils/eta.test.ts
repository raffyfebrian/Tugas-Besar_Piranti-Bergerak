import { describe, expect, it } from 'vitest';

import type { Order, OrderStatus } from '../types';

import { DELIVERY_MINUTES, MAX_TOTAL_MINUTES, estimateOrderEta, ticketMinutes } from './eta';

const at = (minutesAgo: number, now = Date.now()): string => new Date(now - minutesAgo * 60000).toISOString();

interface OrderOptions {
  id?: string;
  status?: OrderStatus;
  createdAt?: string;
  processedAt?: string;
  items?: number;
}

const makeOrder = ({
  id = 'order-1',
  status = 'menunggu_validasi',
  createdAt = at(1),
  processedAt,
  items = 1,
}: OrderOptions = {}): Order => {
  const timeline = [{ status: 'menunggu_pembayaran' as OrderStatus, at: createdAt, by: 'Tamu' }];
  if (processedAt) timeline.push({ status: 'diproses' as OrderStatus, at: processedAt, by: 'Dapur' });
  return {
    id,
    code: `NGF-TEST-${id}`,
    room: '204',
    guestName: 'Tamu',
    items: Array.from({ length: items }, (_, index) => ({
      menuId: `menu-${index}`,
      name: `Menu ${index}`,
      price: 20000,
      qty: 1,
      note: '',
    })),
    total: 20000 * items,
    payment: 'qris',
    status,
    createdAt,
    updatedAt: createdAt,
    timeline,
  };
};

describe('ticketMinutes', () => {
  it('menambah waktu untuk setiap item tambahan', () => {
    expect(ticketMinutes(makeOrder({ items: 1 }))).toBe(6);
    expect(ticketMinutes(makeOrder({ items: 3 }))).toBe(10);
  });

  it('membatasi waktu penyiapan agar tidak berlebihan', () => {
    expect(ticketMinutes(makeOrder({ items: 40 }))).toBe(28);
  });
});

describe('estimateOrderEta', () => {
  it('tidak memberi estimasi untuk status final atau yang belum dibayar', () => {
    const now = Date.now();
    expect(estimateOrderEta(makeOrder({ status: 'menunggu_pembayaran' }), [], now)).toBeNull();
    expect(estimateOrderEta(makeOrder({ status: 'selesai' }), [], now)).toBeNull();
    expect(estimateOrderEta(makeOrder({ status: 'dibatalkan' }), [], now)).toBeNull();
  });

  it('memakai waktu antar saja ketika pesanan sudah siap diantar', () => {
    const now = Date.now();
    const eta = estimateOrderEta(makeOrder({ status: 'siap_diantar' }), [], now);
    expect(eta?.minutes).toBe(DELIVERY_MINUTES);
  });

  it('menghitung sisa waktu pesanan yang baru mulai diproses', () => {
    const now = Date.now();
    const order = makeOrder({ status: 'diproses', processedAt: at(0, now) });
    const eta = estimateOrderEta(order, [order], now);
    expect(eta?.minutes).toBe(10);
  });

  it('mengurangi estimasi sesuai waktu yang sudah berjalan di dapur', () => {
    const now = Date.now();
    const order = makeOrder({ status: 'diproses', processedAt: at(20, now) });
    const eta = estimateOrderEta(order, [order], now);
    expect(eta?.minutes).toBe(5);
  });

  it('menambahkan antrean pesanan lain yang masuk lebih dulu', () => {
    const now = Date.now();
    const older = makeOrder({ id: 'order-0', createdAt: at(9, now) });
    const order = makeOrder({ id: 'order-1', createdAt: at(1, now) });
    const eta = estimateOrderEta(order, [order, older], now);
    expect(eta?.minutes).toBe(16);
  });

  it('tidak menghitung pesanan lain yang sudah selesai', () => {
    const now = Date.now();
    const finished = makeOrder({ id: 'order-0', status: 'selesai', createdAt: at(20, now) });
    const order = makeOrder({ id: 'order-1', createdAt: at(1, now) });
    const eta = estimateOrderEta(order, [order, finished], now);
    expect(eta?.minutes).toBe(10);
  });

  it('membatasi total estimasi saat antrean sangat panjang', () => {
    const now = Date.now();
    const queue = Array.from({ length: 12 }, (_, index) =>
      makeOrder({ id: `order-${index}`, createdAt: at(30 - index, now) }),
    );
    const order = makeOrder({ id: 'order-last', createdAt: at(0, now) });
    const eta = estimateOrderEta(order, [...queue, order], now);
    expect(eta?.minutes).toBe(MAX_TOTAL_MINUTES);
  });
});
