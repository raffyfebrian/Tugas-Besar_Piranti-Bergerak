/**
 * Skema aplikasi Ngoffe ID. QR kamar memakai skema ini agar bisa langsung
 * membuka APK, tanpa bergantung pada alamat localhost saat demo di HP.
 */
export const APP_SCHEMES = ['ngoffe:', 'id.ngoffe.cafe:'] as const;

const ROOM_PATTERN = /^[A-Za-z0-9-]{1,12}$/;

/** Deep link yang dicetak di QR kamar, contoh: ngoffe://order?room=204 */
export const roomDeepLink = (roomNumber: string): string =>
  `ngoffe://order?room=${encodeURIComponent(roomNumber.trim())}`;

/**
 * Mengubah URL deep link menjadi path internal aplikasi.
 * Hanya rute pemesanan kamar yang diterima; URL lain ditolak supaya tautan
 * asing tidak bisa memaksa aplikasi pindah ke halaman staf.
 */
export const deepLinkToPath = (url: string | null | undefined): string | null => {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const isAppScheme = (APP_SCHEMES as readonly string[]).includes(parsed.protocol);
  if (!isAppScheme && parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // ngoffe://order?room=204  -> host "order", pathname ""
  // ngoffe:///order?room=204  -> host "", pathname "/order"
  // https://domain/order?...  -> pathname "/order"
  const combined = isAppScheme ? `${parsed.hostname}${parsed.pathname}` : parsed.pathname;
  let path = combined.startsWith('/') ? combined : `/${combined}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  if (path !== '/order') return null;

  const room = parsed.searchParams.get('room')?.trim() ?? '';
  if (!ROOM_PATTERN.test(room)) return null;

  return `/order?${new URLSearchParams({ room }).toString()}`;
};
