import { describe, expect, it } from 'vitest';

import { deepLinkToPath, roomDeepLink } from './deepLink';

describe('roomDeepLink', () => {
  it('membuat deep link aplikasi untuk nomor kamar', () => {
    expect(roomDeepLink('204')).toBe('ngoffe://order?room=204');
  });

  it('meng-encode karakter khusus dan memangkas spasi', () => {
    expect(roomDeepLink(' A-1 ')).toBe('ngoffe://order?room=A-1');
  });
});

describe('deepLinkToPath', () => {
  it('menerima kedua skema aplikasi', () => {
    expect(deepLinkToPath('ngoffe://order?room=204')).toBe('/order?room=204');
    expect(deepLinkToPath('id.ngoffe.cafe://order?room=101')).toBe('/order?room=101');
  });

  it('menerima bentuk tanpa host dan dengan garis miring tambahan', () => {
    expect(deepLinkToPath('ngoffe:///order?room=305')).toBe('/order?room=305');
    expect(deepLinkToPath('ngoffe://order/?room=305')).toBe('/order?room=305');
  });

  it('menerima tautan https ke rute pemesanan yang sama', () => {
    expect(deepLinkToPath('https://ngoffe.example/order?room=202')).toBe('/order?room=202');
  });

  it('menolak rute selain pemesanan kamar', () => {
    expect(deepLinkToPath('ngoffe://staff?room=204')).toBeNull();
    expect(deepLinkToPath('ngoffe://order/menu?room=204')).toBeNull();
    expect(deepLinkToPath('https://ngoffe.example/admin')).toBeNull();
  });

  it('menolak skema asing, URL kosong, dan nomor kamar tidak valid', () => {
    expect(deepLinkToPath('ftp://order?room=204')).toBeNull();
    expect(deepLinkToPath('javascript:alert(1)')).toBeNull();
    expect(deepLinkToPath('ngoffe://order')).toBeNull();
    expect(deepLinkToPath('ngoffe://order?room=')).toBeNull();
    expect(deepLinkToPath('ngoffe://order?room=204%20A')).toBeNull();
    expect(deepLinkToPath('')).toBeNull();
    expect(deepLinkToPath(null)).toBeNull();
    expect(deepLinkToPath(undefined)).toBeNull();
  });
});
