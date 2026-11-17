import { describe, expect, it } from 'vitest';

import type { Order } from '../types';

import { latestReviews, menuRatingMap, ratingDistribution, summarizeRatings } from './feedback';

const order = (id: string, rating: number | undefined, menuIds: string[], at = '2026-11-01T10:00:00.000Z'): Order => ({
  id,
  code: `NGF-${id}`,
  room: '204',
  guestName: 'Tamu',
  items: menuIds.map((menuId) => ({ menuId, name: menuId, price: 20000, qty: 1, note: '' })),
  total: 20000 * menuIds.length,
  payment: 'cash',
  status: 'selesai',
  createdAt: at,
  updatedAt: at,
  timeline: [],
  feedback: rating ? { rating, at } : undefined,
});

describe('summarizeRatings', () => {
  it('mengembalikan nol bila belum ada ulasan', () => {
    expect(summarizeRatings([])).toEqual({ count: 0, average: 0 });
    expect(summarizeRatings([order('1', undefined, ['kopi'])])).toEqual({ count: 0, average: 0 });
  });

  it('menghitung rata-rata dengan satu desimal', () => {
    const summary = summarizeRatings([order('1', 5, ['kopi']), order('2', 4, ['teh']), order('3', 4, ['roti'])]);
    expect(summary).toEqual({ count: 3, average: 4.3 });
  });

  it('mengabaikan pesanan tanpa ulasan', () => {
    const summary = summarizeRatings([order('1', 5, ['kopi']), order('2', undefined, ['teh'])]);
    expect(summary).toEqual({ count: 1, average: 5 });
  });
});

describe('menuRatingMap', () => {
  it('membagikan rating ke setiap menu pada pesanan', () => {
    const map = menuRatingMap([order('1', 5, ['kopi', 'roti']), order('2', 3, ['kopi'])]);
    expect(map['kopi']).toEqual({ count: 2, average: 4 });
    expect(map['roti']).toEqual({ count: 1, average: 5 });
  });

  it('tidak memasukkan menu dari pesanan tanpa ulasan', () => {
    expect(menuRatingMap([order('1', undefined, ['teh'])]).teh).toBeUndefined();
  });
});

describe('latestReviews', () => {
  it('mengurutkan dari ulasan terbaru dan membatasi jumlahnya', () => {
    const reviews = latestReviews(
      [
        order('1', 4, ['a'], '2026-11-01T08:00:00.000Z'),
        order('2', 5, ['b'], '2026-11-01T09:00:00.000Z'),
        order('3', undefined, ['c'], '2026-11-01T10:00:00.000Z'),
      ],
      1,
    );
    expect(reviews.map((item) => item.id)).toEqual(['2']);
  });
});

describe('ratingDistribution', () => {
  it('menghitung jumlah ulasan per bintang dari 5 ke 1', () => {
    const distribution = ratingDistribution([order('1', 5, ['a']), order('2', 5, ['b']), order('3', 2, ['c'])]);
    expect(distribution).toEqual([
      { star: 5, count: 2 },
      { star: 4, count: 0 },
      { star: 3, count: 0 },
      { star: 2, count: 1 },
      { star: 1, count: 0 },
    ]);
  });
});
