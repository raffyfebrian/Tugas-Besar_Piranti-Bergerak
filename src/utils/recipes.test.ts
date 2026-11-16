import { describe, expect, it } from 'vitest';

import type { MenuItem, OrderLine, StockItem } from '../types';

import { applyConsumption, consumptionFor, orderConsumption, restoreConsumption, roundQty } from './recipes';

const stock: StockItem[] = [
  { id: 'stock-biji-kopi', name: 'Biji Kopi Arabika', unit: 'kg', qty: 1, min: 0.5 },
  { id: 'stock-susu', name: 'Susu UHT', unit: 'liter', qty: 1, min: 0.2 },
  { id: 'stock-cup', name: 'Cup Takeaway', unit: 'pcs', qty: 10, min: 5 },
];

const menu: MenuItem[] = [
  {
    id: 'kopi-latte',
    name: 'Caffè Latte',
    category: 'Kopi',
    price: 28000,
    description: '',
    emoji: '🥛',
    gradient: '',
    available: true,
    recipe: [
      { stockId: 'stock-biji-kopi', qty: 0.018 },
      { stockId: 'stock-susu', qty: 0.18 },
      { stockId: 'stock-cup', qty: 1 },
    ],
  },
  {
    id: 'camilan-croissant',
    name: 'Butter Croissant',
    category: 'Camilan',
    price: 25000,
    description: '',
    emoji: '🥐',
    gradient: '',
    available: true,
    recipe: [{ stockId: 'stock-cup', qty: 1 }],
  },
];

const lines: OrderLine[] = [
  { menuId: 'kopi-latte', name: 'Caffè Latte', price: 28000, qty: 2, note: '' },
  { menuId: 'camilan-croissant', name: 'Butter Croissant', price: 25000, qty: 1, note: '' },
];

describe('consumptionFor', () => {
  it('mengalikan resep dengan jumlah item', () => {
    expect(consumptionFor(lines, menu)).toEqual([
      { stockId: 'stock-biji-kopi', qty: 0.04 },
      { stockId: 'stock-susu', qty: 0.36 },
      { stockId: 'stock-cup', qty: 3 },
    ]);
  });

  it('mengabaikan menu tanpa resep', () => {
    expect(consumptionFor([{ menuId: 'tidak-ada', name: '', price: 0, qty: 1, note: '' }], menu)).toEqual([]);
  });
});

describe('applyConsumption', () => {
  it('mengurangi stok sesuai pemakaian dan membulatkan dua desimal', () => {
    const result = applyConsumption(stock, consumptionFor(lines, menu));
    expect(result.find((item) => item.id === 'stock-biji-kopi')?.qty).toBe(0.96);
    expect(result.find((item) => item.id === 'stock-susu')?.qty).toBe(0.64);
    expect(result.find((item) => item.id === 'stock-cup')?.qty).toBe(7);
  });

  it('tidak membuat stok negatif', () => {
    const result = applyConsumption(
      [{ id: 'stock-cup', name: 'Cup', unit: 'pcs', qty: 1, min: 0 }],
      [{ stockId: 'stock-cup', qty: 5 }],
    );
    expect(result[0].qty).toBe(0);
  });
});

describe('restoreConsumption', () => {
  it('mengembalikan bahan ke stok', () => {
    const result = restoreConsumption(stock, consumptionFor(lines, menu));
    expect(result.find((item) => item.id === 'stock-biji-kopi')?.qty).toBe(1.04);
    expect(result.find((item) => item.id === 'stock-cup')?.qty).toBe(13);
  });
});

describe('orderConsumption', () => {
  it('melengkapi nama dan satuan bahan untuk ditampilkan', () => {
    expect(orderConsumption(lines, menu, stock)).toContainEqual({
      stockId: 'stock-susu',
      name: 'Susu UHT',
      unit: 'liter',
      qty: 0.36,
    });
  });
});

describe('roundQty', () => {
  it('membulatkan ke dua desimal', () => {
    expect(roundQty(0.018000000000000002)).toBe(0.02);
    expect(roundQty(1.006)).toBe(1.01);
  });
});
