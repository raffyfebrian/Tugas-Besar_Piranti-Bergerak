import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';

import { createInitialState } from '../data/seed';
import type { AppState, Order, OrderStatus, PaymentMethod, Shift } from '../types';

import { AppProvider, useApp } from './AppStore';

const STORAGE_KEY = 'ngoffe-ionic-state-v1';
const iso = (offsetMinutes: number) => new Date(Date.now() + offsetMinutes * 60_000).toISOString();

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-test',
  code: 'NGF-TEST-0001',
  room: '204',
  guestName: 'Tamu Uji',
  items: [{ menuId: 'kopi-cappuccino', name: 'Cappuccino', price: 28000, qty: 2, note: 'tanpa gula' }],
  total: 56000,
  payment: 'qris',
  status: 'menunggu_validasi',
  createdAt: iso(-10),
  updatedAt: iso(-10),
  timeline: [{ status: 'menunggu_validasi', at: iso(-10), by: 'Tamu' }],
  ...overrides,
});

const scopedOrder = (id: string, payment: PaymentMethod, total: number, status: OrderStatus): Order =>
  makeOrder({
    id,
    code: `NGF-TEST-${id}`,
    payment,
    total,
    status,
    createdAt: iso(1),
    updatedAt: iso(1),
  });

type Api = ReturnType<typeof useApp>;

const setup = (patch: Partial<AppState> = {}) => {
  const state: AppState = { ...createInitialState(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return renderHook(() => useApp(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const stockOf = (api: Api, id: string): number => api.state.stock.find((item) => item.id === id)?.qty ?? -1;

const loginKasir = (api: Api) => {
  let result!: ReturnType<Api['login']>;
  act(() => {
    result = api.login('kasir@ngoffe.id', 'kasir123');
  });
  expect(result.ok).toBe(true);
};

describe('stok dari resep di store', () => {
  beforeEach(() => localStorage.clear());

  test('dipotong sekali saat pesanan pertama kali masuk dapur', () => {
    const order = makeOrder();
    const { result } = setup({ orders: [order] });
    const coffeeBefore = stockOf(result.current, 'stock-biji-kopi');
    const cupBefore = stockOf(result.current, 'stock-cup');

    act(() => result.current.setOrderStatus(order.id, 'diproses', 'Kasir', 'Pembayaran valid'));
    expect(stockOf(result.current, 'stock-biji-kopi')).toBeCloseTo(coffeeBefore - 0.04, 2);
    expect(stockOf(result.current, 'stock-cup')).toBe(cupBefore - 2);

    act(() => result.current.setOrderStatus(order.id, 'siap_diantar', 'Kitchen'));
    act(() => result.current.setOrderStatus(order.id, 'diproses', 'Kasir', 'Diproses ulang'));
    expect(stockOf(result.current, 'stock-biji-kopi')).toBeCloseTo(coffeeBefore - 0.04, 2);
    expect(stockOf(result.current, 'stock-cup')).toBe(cupBefore - 2);
  });
});

describe('void / refund', () => {
  beforeEach(() => localStorage.clear());

  test('mengembalikan stok, membatasi refund, dan menulis audit', () => {
    const order = makeOrder();
    const { result } = setup({ orders: [order] });
    const coffeeBefore = stockOf(result.current, 'stock-biji-kopi');

    act(() => result.current.setOrderStatus(order.id, 'diproses', 'Kasir', 'Pembayaran valid'));
    act(() =>
      result.current.voidOrder(order.id, {
        reason: '  Tamu salah pesan  ',
        by: 'Kasir',
        refund: 'qris',
        amount: 999_999,
      }),
    );

    const saved = result.current.state.orders[0];
    expect(saved.status).toBe('dibatalkan');
    expect(saved.refundAmount).toBe(order.total);
    expect(saved.refundMethod).toBe('qris');
    expect(saved.voidReason).toBe('Tamu salah pesan');
    expect(saved.stockRestored).toBe(true);
    expect(stockOf(result.current, 'stock-biji-kopi')).toBeCloseTo(coffeeBefore, 2);
    expect(result.current.state.audits[0]).toMatchObject({
      action: 'refund',
      amount: order.total,
      method: 'qris',
      reason: 'Tamu salah pesan',
      by: 'Kasir',
      orderId: order.id,
      orderCode: order.code,
    });

    act(() => result.current.voidOrder(order.id, { reason: 'ulang', by: 'Kasir', refund: 'none', amount: 0 }));
    expect(result.current.state.audits).toHaveLength(1);
    expect(stockOf(result.current, 'stock-biji-kopi')).toBeCloseTo(coffeeBefore, 2);
  });

  test('tidak mengembalikan stok bila pesanan belum masuk dapur', () => {
    const order = makeOrder();
    const { result } = setup({ orders: [order] });
    const coffeeBefore = stockOf(result.current, 'stock-biji-kopi');

    act(() =>
      result.current.voidOrder(order.id, { reason: 'Bahan habis', by: 'Kasir', refund: 'cash', amount: 10_000 }),
    );

    expect(stockOf(result.current, 'stock-biji-kopi')).toBeCloseTo(coffeeBefore, 2);
    expect(result.current.state.orders[0].stockRestored).toBe(false);
    expect(result.current.state.audits[0]).toMatchObject({ action: 'refund', amount: 10_000, method: 'cash' });
  });

  test('void tanpa refund tercatat dengan jumlah nol', () => {
    const order = makeOrder();
    const { result } = setup({ orders: [order] });

    act(() =>
      result.current.voidOrder(order.id, { reason: 'Tamu membatalkan', by: 'Kasir', refund: 'none', amount: 0 }),
    );

    expect(result.current.state.orders[0].refundAmount).toBe(0);
    expect(result.current.state.audits[0]).toMatchObject({ action: 'void', amount: 0, method: 'none' });
  });
});

describe('shift kasir', () => {
  beforeEach(() => localStorage.clear());

  test('memakai ulang shift yang masih terbuka untuk staf yang sama', () => {
    const { result } = setup();
    loginKasir(result.current);

    let first!: Shift;
    act(() => {
      first = result.current.openShift(100_000)!;
    });
    let second!: Shift;
    act(() => {
      second = result.current.openShift(150_000)!;
    });

    expect(first.openingCash).toBe(100_000);
    expect(second.id).toBe(first.id);
    expect(result.current.state.shifts).toHaveLength(1);
  });

  test('menutup shift dengan kas, QRIS, dan jumlah pesanan yang benar', () => {
    const orders = [
      scopedOrder('cash-ok', 'cash', 50_000, 'selesai'),
      scopedOrder('qris-ok', 'qris', 30_000, 'diproses'),
      scopedOrder('cash-batal', 'cash', 20_000, 'dibatalkan'),
      scopedOrder('cash-belum-bayar', 'cash', 10_000, 'menunggu_pembayaran'),
      makeOrder({ id: 'cash-lama', code: 'NGF-TEST-LAMA', payment: 'cash', total: 99_999, status: 'selesai' }),
    ];
    const { result } = setup({ orders });
    loginKasir(result.current);

    act(() => result.current.openShift(100_000));
    act(() => result.current.closeShift(160_000, '  lebih  '));

    expect(result.current.state.shifts[0]).toMatchObject({
      status: 'closed',
      openingCash: 100_000,
      closingCash: 160_000,
      expectedCash: 150_000,
      cashSales: 50_000,
      qrisSales: 30_000,
      orderCount: 2,
      note: 'lebih',
    });
    expect(result.current.state.shifts[0].closedAt).toBeTruthy();

    act(() => result.current.closeShift(999_999));
    expect(result.current.state.shifts[0].closingCash).toBe(160_000);
  });
});
