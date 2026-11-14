import type { Order, OrderStatus, PaymentMethod, Role } from '../types';

export const rupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso));

export const timeAgo = (iso: string): string => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
};

export const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const dateKey = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

export const orderCode = (orders: Order[], date = new Date()): string => {
  const prefix = `NGF-${dateKey(date)}-`;
  const sequence =
    orders
      .filter((order) => order.code.startsWith(prefix))
      .map((order) => Number.parseInt(order.code.slice(prefix.length), 10) || 0)
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export const statusLabel: Record<OrderStatus, string> = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  menunggu_validasi: 'Menunggu Validasi',
  diproses: 'Diproses Dapur',
  siap_diantar: 'Siap Diantar',
  diantar: 'Sedang Diantar',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const statusColor: Record<OrderStatus, string> = {
  menunggu_pembayaran: 'warning',
  menunggu_validasi: 'tertiary',
  diproses: 'primary',
  siap_diantar: 'success',
  diantar: 'secondary',
  selesai: 'medium',
  dibatalkan: 'danger',
};

export const paymentLabel: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  cash: 'Cash',
};

export const roleLabel: Record<Role, string> = {
  kasir: 'Kasir',
  kitchen: 'Kitchen',
  admin: 'Admin',
};

export const roleHome: Record<Role, string> = {
  kasir: '/staff/kasir',
  kitchen: '/staff/kitchen',
  admin: '/admin',
};

export const orderItemCount = (order: Order): number => order.items.reduce((total, item) => total + item.qty, 0);

/**
 * Rata-rata durasi dari pesanan mulai diproses dapur sampai diantar/selesai.
 * Mengembalikan null bila belum ada pesanan yang tuntas, sehingga UI bisa
 * memakai estimasi awal alih-alih menampilkan angka palsu.
 */
export const averageDeliveryMinutes = (orders: Order[]): number | null => {
  const durations = orders
    .map((order) => {
      const started = order.timeline.find((entry) => entry.status === 'diproses')?.at ?? order.createdAt;
      const finished = order.timeline.find((entry) => entry.status === 'diantar' || entry.status === 'selesai')?.at;
      if (!finished) return null;
      const minutes = (new Date(finished).getTime() - new Date(started).getTime()) / 60000;
      return minutes > 0 && minutes < 180 ? minutes : null;
    })
    .filter((minutes): minutes is number => minutes !== null);

  if (!durations.length) return null;
  return Math.round(durations.reduce((total, minutes) => total + minutes, 0) / durations.length);
};
