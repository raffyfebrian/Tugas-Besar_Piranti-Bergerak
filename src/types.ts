export type Role = 'kasir' | 'kitchen' | 'admin';

export type MenuCategory = 'Kopi' | 'Non-Kopi' | 'Makanan' | 'Camilan';

/** Satu bahan yang dipakai untuk membuat satu porsi menu. */
export interface RecipeIngredient {
  stockId: string;
  /** Jumlah bahan per porsi, dalam satuan stok (mis. 0.018 kg biji kopi). */
  qty: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  emoji: string;
  gradient: string;
  available: boolean;
  /** Resep bahan baku; dipakai untuk memotong stok otomatis saat pesanan masuk dapur. */
  recipe?: RecipeIngredient[];
}

/** Status penyiapan per item di dapur, dipakai timer masak. */
export interface PrepItem {
  menuId: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface OrderPrep {
  items: PrepItem[];
}

export interface CartLine {
  menuId: string;
  qty: number;
  note: string;
}

export interface OrderLine extends CartLine {
  name: string;
  price: number;
}

export type PaymentMethod = 'qris' | 'cash';

export type OrderStatus =
  'menunggu_pembayaran' | 'menunggu_validasi' | 'diproses' | 'siap_diantar' | 'diantar' | 'selesai' | 'dibatalkan';

export interface TimelineEntry {
  status: OrderStatus;
  at: string;
  by: string;
  note?: string;
}

/** Ulasan tamu setelah pesanan selesai. */
export interface OrderFeedback {
  rating: number;
  comment?: string;
  at: string;
}

export interface Order {
  id: string;
  code: string;
  room: string;
  guestName: string;
  items: OrderLine[];
  total: number;
  payment: PaymentMethod;
  proofName?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEntry[];
  cancelReason?: string;
  /** Timer masak per item yang dijalankan dapur. */
  prep?: OrderPrep;
  /** True bila bahan pesanan ini sudah dikembalikan ke stok saat void/refund. */
  stockRestored?: boolean;
  voidReason?: string;
  refundAmount?: number;
  refundMethod?: RefundMethod;
  voidedAt?: string;
  /** Rating bintang + komentar dari tamu. */
  feedback?: OrderFeedback;
}

export type RefundMethod = 'none' | 'cash' | 'qris';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashSales?: number;
  qrisSales?: number;
  orderCount?: number;
  note?: string;
  status: 'open' | 'closed';
}

export type AuditAction = 'void' | 'refund';

/** Jejak audit aksi sensitif kasir (void/refund) untuk kebutuhan pemeriksaan. */
export interface AuditEntry {
  id: string;
  at: string;
  by: string;
  action: AuditAction;
  orderId: string;
  orderCode: string;
  amount: number;
  reason: string;
  method: RefundMethod;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  token: string;
  active: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  min: number;
}

export interface Settings {
  cafeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  openHours: string;
  qrisMerchant: string;
}

export interface Session {
  staffId: string;
  name: string;
  role: Role;
}

export interface AppState {
  menu: MenuItem[];
  orders: Order[];
  staff: StaffMember[];
  rooms: Room[];
  stock: StockItem[];
  settings: Settings;
  session: Session | null;
  cart: CartLine[];
  room: string;
  guestName: string;
  shifts: Shift[];
  audits: AuditEntry[];
}
