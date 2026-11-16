import type { MenuItem, OrderLine, StockItem } from '../types';

/** Pembulatan stok ke dua desimal agar bahan seperti 0.018 kg tetap tercatat. */
export const roundQty = (value: number): number => Math.round(value * 100) / 100;

export interface Consumption {
  stockId: string;
  qty: number;
}

export interface ConsumptionLine extends Consumption {
  name: string;
  unit: string;
}

/**
 * Total bahan yang terpakai untuk sekumpulan item pesanan.
 * Resep bersifat per porsi, jadi qty resep dikali jumlah item.
 */
export const consumptionFor = (items: OrderLine[], menu: MenuItem[]): Consumption[] => {
  const totals = new Map<string, number>();
  items.forEach((item) => {
    const menuItem = menu.find((entry) => entry.id === item.menuId);
    menuItem?.recipe?.forEach((ingredient) => {
      totals.set(ingredient.stockId, (totals.get(ingredient.stockId) ?? 0) + ingredient.qty * item.qty);
    });
  });

  return [...totals.entries()]
    .map(([stockId, qty]) => ({ stockId, qty: roundQty(qty) }))
    .filter((line) => line.qty > 0);
};

/** Mengurangi stok sesuai resep, tanpa pernah membuat stok negatif. */
export const applyConsumption = (stock: StockItem[], consumption: Consumption[]): StockItem[] =>
  stock.map((item) => {
    const used = consumption.find((line) => line.stockId === item.id);
    if (!used) return item;
    return { ...item, qty: Math.max(0, roundQty(item.qty - used.qty)) };
  });

/** Mengembalikan bahan ke stok (dipakai saat void/refund setelah pesanan diproses). */
export const restoreConsumption = (stock: StockItem[], consumption: Consumption[]): StockItem[] =>
  stock.map((item) => {
    const used = consumption.find((line) => line.stockId === item.id);
    if (!used) return item;
    return { ...item, qty: roundQty(item.qty + used.qty) };
  });

/** Ringkasan bahan yang dipakai sebuah pesanan, siap ditampilkan di UI. */
export const orderConsumption = (items: OrderLine[], menu: MenuItem[], stock: StockItem[]): ConsumptionLine[] =>
  consumptionFor(items, menu).map((line) => {
    const item = stock.find((entry) => entry.id === line.stockId);
    return { ...line, name: item?.name ?? line.stockId, unit: item?.unit ?? '' };
  });

/** Bahan yang berada di bawah atau sama dengan batas minimum. */
export const lowStockItems = (stock: StockItem[]): StockItem[] => stock.filter((item) => item.qty <= item.min);
