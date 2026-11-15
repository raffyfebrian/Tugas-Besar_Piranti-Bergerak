import { describe, expect, it } from 'vitest';

import type { Order, Settings } from '../types';

import { receiptText } from './share';

const settings: Settings = {
  cafeName: 'Ngoffe ID',
  tagline: 'Café & Hotel',
  address: 'Jl. Melati No. 8',
  phone: '0812-0000-0000',
  email: 'hello@ngoffe.id',
  openHours: '07.00 - 22.00',
  qrisMerchant: 'NGOFFE ID',
};

const order: Order = {
  id: 'order-test',
  code: 'NGF-20261115-0001',
  room: '204',
  guestName: 'Tamu Demo',
  items: [
    { menuId: 'menu-1', name: 'Kopi Susu Gula Aren', price: 25000, qty: 2, note: 'Less sugar' },
    { menuId: 'menu-2', name: 'Croissant Butter', price: 18000, qty: 1, note: '' },
  ],
  total: 68000,
  payment: 'qris',
  status: 'selesai',
  createdAt: '2026-11-15T10:30:00.000Z',
  updatedAt: '2026-11-15T10:55:00.000Z',
  timeline: [],
};

describe('receiptText', () => {
  it('memuat identitas kafe, detail pesanan, dan item', () => {
    const text = receiptText(order, settings);

    expect(text).toContain('NGOFFE ID');
    expect(text).toContain('NGF-20261115-0001');
    expect(text).toContain('Kamar       : 204');
    expect(text).toContain('2x Kopi Susu Gula Aren');
    expect(text).toContain('* Less sugar');
    expect(text).toContain('1x Croissant Butter');
    expect(text).toContain('TOTAL');
    expect(text).toContain('QRIS');
    expect(text).toContain('Selesai');
  });
});
