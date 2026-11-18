import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';

import { createInitialState } from '../data/seed';
import type { CartLine } from '../types';

import { AppProvider, useApp } from './AppStore';

const STORAGE_KEY = 'ngoffe-ionic-state-v1';
const removed: CartLine = { menuId: 'kopi-cappuccino', qty: 2, note: 'tanpa gula' };
const others: CartLine[] = [
  { menuId: 'camilan-croissant', qty: 1, note: 'hangat' },
  { menuId: 'non-matcha', qty: 1, note: '' },
];

const Harness = () => {
  const { state, removeFromCart, restoreCartLine } = useApp();
  return (
    <>
      <output data-testid="cart">{JSON.stringify(state.cart)}</output>
      <button type="button" onClick={() => removeFromCart(removed.menuId)}>
        hapus
      </button>
      <button type="button" onClick={() => restoreCartLine(removed, 0)}>
        undo-awal
      </button>
      <button type="button" onClick={() => restoreCartLine(removed, 99)}>
        undo-akhir
      </button>
    </>
  );
};

const cartOf = (): CartLine[] => JSON.parse(screen.getByTestId('cart').textContent ?? '[]') as CartLine[];

const click = (label: string) => {
  act(() => screen.getByText(label).click());
};

const setup = () => {
  const state = createInitialState();
  state.cart = [removed, ...others];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render(
    <AppProvider>
      <Harness />
    </AppProvider>,
  );
};

describe('Undo penghapusan keranjang', () => {
  beforeEach(() => localStorage.clear());

  test('mengembalikan baris ke indeks semula dengan qty dan catatan utuh', () => {
    setup();
    expect(cartOf()).toEqual([removed, ...others]);

    click('hapus');
    expect(cartOf()).toEqual(others);

    click('undo-awal');
    expect(cartOf()).toEqual([removed, ...others]);
  });

  test('tidak menduplikasi baris yang sudah ada di keranjang', () => {
    setup();
    click('undo-awal');
    expect(cartOf()).toEqual([removed, ...others]);
    expect(cartOf().filter((line) => line.menuId === removed.menuId)).toHaveLength(1);
  });

  test('mengunci indeks ke rentang yang valid saat disisipkan di akhir', () => {
    setup();
    click('hapus');
    click('undo-akhir');
    expect(cartOf().map((line) => line.menuId)).toEqual([...others.map((line) => line.menuId), removed.menuId]);
  });
});
