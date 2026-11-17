import type { Order } from '../types';

export interface RatingSummary {
  count: number;
  average: number;
}

const EMPTY: RatingSummary = { count: 0, average: 0 };

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Rata-rata rating dari pesanan yang sudah diulas. */
export const summarizeRatings = (orders: Order[]): RatingSummary => {
  const ratings = orders.map((order) => order.feedback?.rating).filter((rating): rating is number => Boolean(rating));
  if (!ratings.length) return EMPTY;
  return {
    count: ratings.length,
    average: round1(ratings.reduce((total, rating) => total + rating, 0) / ratings.length),
  };
};

/** Rating per menu: setiap ulasan berlaku untuk semua menu di pesanan tersebut. */
export const menuRatingMap = (orders: Order[]): Record<string, RatingSummary> => {
  const buckets = new Map<string, number[]>();
  orders.forEach((order) => {
    const rating = order.feedback?.rating;
    if (!rating) return;
    order.items.forEach((item) => {
      const values = buckets.get(item.menuId) ?? [];
      values.push(rating);
      buckets.set(item.menuId, values);
    });
  });

  return Object.fromEntries(
    [...buckets.entries()].map(([menuId, values]) => [
      menuId,
      {
        count: values.length,
        average: round1(values.reduce((total, rating) => total + rating, 0) / values.length),
      },
    ]),
  );
};

/** Ulasan terbaru, diurutkan dari yang paling baru. */
export const latestReviews = (orders: Order[], limit = 5): Order[] =>
  orders
    .filter((order) => Boolean(order.feedback))
    .sort((a, b) => (b.feedback?.at ?? '').localeCompare(a.feedback?.at ?? ''))
    .slice(0, limit);

/** Jumlah ulasan per bintang (5..1) untuk grafik distribusi. */
export const ratingDistribution = (orders: Order[]): { star: number; count: number }[] => {
  const counts = new Map<number, number>();
  orders.forEach((order) => {
    const rating = order.feedback?.rating;
    if (!rating) return;
    counts.set(rating, (counts.get(rating) ?? 0) + 1);
  });
  return [5, 4, 3, 2, 1].map((star) => ({ star, count: counts.get(star) ?? 0 }));
};
