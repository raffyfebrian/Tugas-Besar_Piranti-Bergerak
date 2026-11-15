import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

import type { Order, Settings } from '../types';

import { formatDateTime, paymentLabel, rupiah, statusLabel } from './format';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Teks struk polos yang bisa dikirim ke WhatsApp, SMS, atau aplikasi lain. */
export const receiptText = (order: Order, settings: Settings): string => {
  const lines: string[] = [
    settings.cafeName.toUpperCase(),
    settings.tagline,
    settings.address,
    settings.phone,
    '',
    '--------------------------------',
    `No. Pesanan : ${order.code}`,
    `Kamar       : ${order.room}`,
    `Tamu        : ${order.guestName}`,
    `Waktu       : ${formatDateTime(order.createdAt)}`,
    '--------------------------------',
  ];

  order.items.forEach((item) => {
    lines.push(`${item.qty}x ${item.name}`);
    lines.push(`   ${rupiah(item.price * item.qty)}`);
    if (item.note) lines.push(`   * ${item.note}`);
  });

  lines.push(
    '--------------------------------',
    `TOTAL       : ${rupiah(order.total)}`,
    `Pembayaran  : ${paymentLabel[order.payment]}`,
    `Status      : ${statusLabel[order.status]}`,
    '',
    'Terima kasih telah memesan.',
    `${settings.cafeName} — Café & Hotel`,
  );

  return lines.join('\n');
};

const isShareCancel = (error: unknown): boolean => {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /cancel|abort/i.test(message);
};

/**
 * Membagikan struk lewat dialog berbagi native. Bila perangkat/browser tidak
 * mendukung, teks struk disalin ke clipboard sebagai cadangan.
 */
export const shareReceipt = async (order: Order, settings: Settings): Promise<ShareOutcome> => {
  const text = receiptText(order, settings);
  const title = `Struk ${order.code} — ${settings.cafeName}`;

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text, dialogTitle: 'Bagikan struk pesanan' });
      return 'shared';
    } catch (error) {
      if (isShareCancel(error)) return 'cancelled';
      // Plugin tidak tersedia? Lanjut ke Web Share / clipboard.
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (isShareCancel(error)) return 'cancelled';
    }
  }

  try {
    if (!navigator.clipboard) return 'failed';
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
};
