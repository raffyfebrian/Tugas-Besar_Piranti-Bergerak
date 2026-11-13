export type Role = 'kasir' | 'kitchen' | 'admin';

export type MenuCategory = 'Kopi' | 'Non-Kopi' | 'Makanan' | 'Camilan';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  emoji: string;
  gradient: string;
  available: boolean;
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
}
