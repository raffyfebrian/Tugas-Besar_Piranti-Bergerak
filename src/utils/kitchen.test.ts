import { describe, expect, it } from 'vitest';

import type { Order } from '../types';

import { formatPrepClock, prepItemsFor, prepSeconds, prepStats } from './kitchen';

const makeOrder = (prep?: Order['prep']): Order => ({
  id: 'order-1',
  code: 'NGF-TEST-0001',
  room: '204',
  guestName: 'Tamu',
  items: [
    { menuId: 'kopi-latte', name: 'Caffè Latte', price: 28000, qty: 1, note: '' },
    { menuId: 'camilan-croissant', name: 'Butter Croissant', price: 25000, qty: 2, note: '' },
  ],
  total: 78000,
  payment: 'qris',
  status: 'diproses',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  timeline: [],
  prep,
});

describe('prepItemsFor', () => {
  it('memetakan setiap item pesanan walau belum ada timer', () => {
    const items = prepItemsFor(makeOrder());
    expect(items).toEqual([{ menuId: 'kopi-latte' }, { menuId: 'camilan-croissant' }]);
  });

  it('memakai timer yang sudah tersimpan', () => {
    const items = prepItemsFor(makeOrder({ items: [{ menuId: 'kopi-latte', startedAt: '2026-01-01T00:00:00.000Z' }] }));
    expect(items[0].startedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(items[1].startedAt).toBeUndefined();
  });
});

describe('prepStats', () => {
  it('menghitung progres item yang sudah dimulai dan selesai', () => {
    const order = makeOrder({
      items: [
        { menuId: 'kopi-latte', startedAt: '2026-01-01T00:00:00.000Z', finishedAt: '2026-01-01T00:05:00.000Z' },
        { menuId: 'camilan-croissant', startedAt: '2026-01-01T00:01:00.000Z' },
      ],
    });
    expect(prepStats(order)).toEqual({ total: 2, started: 2, finished: 1, remaining: 1, allFinished: false });
  });

  it('menandai selesai hanya bila semua item selesai', () => {
    const order = makeOrder({
      items: [
        { menuId: 'kopi-latte', startedAt: '2026-01-01T00:00:00.000Z', finishedAt: '2026-01-01T00:05:00.000Z' },
        {
          menuId: 'camilan-croissant',
          startedAt: '2026-01-01T00:01:00.000Z',
          finishedAt: '2026-01-01T00:03:00.000Z',
        },
      ],
    });
    expect(prepStats(order).allFinished).toBe(true);
  });
});

describe('prepSeconds', () => {
  it('menghitung durasi berjalan dan durasi final', () => {
    const startedAt = new Date('2026-01-01T00:00:00.000Z').toISOString();
    const now = new Date('2026-01-01T00:02:05.000Z').getTime();
    expect(prepSeconds({ menuId: 'kopi-latte', startedAt }, now)).toBe(125);
    expect(
      prepSeconds(
        { menuId: 'kopi-latte', startedAt, finishedAt: new Date('2026-01-01T00:01:00.000Z').toISOString() },
        now,
      ),
    ).toBe(60);
  });

  it('mengembalikan nol bila timer belum dimulai', () => {
    expect(prepSeconds({ menuId: 'kopi-latte' }, Date.now())).toBe(0);
  });
});

describe('formatPrepClock', () => {
  it('menampilkan menit dan detik dua digit', () => {
    expect(formatPrepClock(0)).toBe('00:00');
    expect(formatPrepClock(75)).toBe('01:15');
    expect(formatPrepClock(3600)).toBe('60:00');
  });
});
