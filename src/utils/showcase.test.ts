import { describe, expect, it } from 'vitest';

import type { MenuItem } from '../types';

import { pickSignatureItems } from './showcase';

const item = (id: string, category: MenuItem['category'], available = true): MenuItem => ({
  id,
  name: `Menu ${id}`,
  category,
  price: 20000,
  description: '',
  emoji: '☕',
  gradient: 'linear-gradient(#fff, #eee)',
  available,
});

describe('pickSignatureItems', () => {
  it('mengambil satu item pertama dari tiap kategori sebelum melengkapi sisanya', () => {
    const menu = [
      item('kopi-1', 'Kopi'),
      item('kopi-2', 'Kopi'),
      item('non-kopi-1', 'Non-Kopi'),
      item('makanan-1', 'Makanan'),
      item('camilan-1', 'Camilan'),
      item('non-kopi-2', 'Non-Kopi'),
    ];

    const picks = pickSignatureItems(menu, 5);

    expect(picks).toHaveLength(5);
    expect(picks.slice(0, 4).map((entry) => entry.id)).toEqual(['kopi-1', 'non-kopi-1', 'makanan-1', 'camilan-1']);
  });

  it('melewati menu yang tidak tersedia', () => {
    const picks = pickSignatureItems([item('habis', 'Kopi', false), item('siap', 'Kopi')], 2);

    expect(picks.map((entry) => entry.id)).toEqual(['siap']);
  });

  it('tidak mengulang item dan menghormati batas jumlah', () => {
    const picks = pickSignatureItems([item('a', 'Kopi'), item('b', 'Kopi'), item('c', 'Kopi')], 2);

    expect(picks.map((entry) => entry.id)).toEqual(['a', 'b']);
  });
});
