import type {
  AppState,
  MenuItem,
  Order,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Room,
  Settings,
  StaffMember,
  StockItem,
  TimelineEntry,
} from '../types';
import { orderCode } from '../utils/format';

const gradient = (from: string, to: string) => `linear-gradient(135deg, ${from}, ${to})`;

export const menuSeed: MenuItem[] = [
  {
    id: 'kopi-espresso',
    name: 'Espresso',
    category: 'Kopi',
    price: 18000,
    description: 'Satu shot pekat dari biji arabika Gayo, aroma kuat dan crema tebal.',
    emoji: '☕',
    gradient: gradient('#123c2d', '#2f7d60'),
    available: true,
  },
  {
    id: 'kopi-americano',
    name: 'Americano',
    category: 'Kopi',
    price: 22000,
    description: 'Espresso dengan air panas, bersih dan ringan untuk memulai hari.',
    emoji: '🖤',
    gradient: gradient('#0f2019', '#1f5c45'),
    available: true,
  },
  {
    id: 'kopi-cappuccino',
    name: 'Cappuccino',
    category: 'Kopi',
    price: 28000,
    description: 'Espresso, susu steamed, dan foam lembut dengan taburan kayu manis.',
    emoji: '☕',
    gradient: gradient('#1b513d', '#7fbf9f'),
    available: true,
  },
  {
    id: 'kopi-latte',
    name: 'Caffè Latte',
    category: 'Kopi',
    price: 28000,
    description: 'Perpaduan espresso dan susu segar dengan latte art dari barista kami.',
    emoji: '🥛',
    gradient: gradient('#296e5e', '#c2d6ca'),
    available: true,
  },
  {
    id: 'kopi-gula-aren',
    name: 'Kopi Susu Gula Aren',
    category: 'Kopi',
    price: 25000,
    description: 'Menu paling dicari: espresso, susu, dan manisnya gula aren asli.',
    emoji: '🧋',
    gradient: gradient('#14442f', '#4f9a72'),
    available: true,
  },
  {
    id: 'kopi-mocha',
    name: 'Café Mocha',
    category: 'Kopi',
    price: 30000,
    description: 'Espresso bertemu cokelat premium dan susu, ditutup whipped cream.',
    emoji: '🍫',
    gradient: gradient('#10241b', '#356c57'),
    available: true,
  },
  {
    id: 'non-matcha',
    name: 'Matcha Latte',
    category: 'Non-Kopi',
    price: 30000,
    description: 'Matcha Uji ceremonial dengan susu segar, disajikan dingin atau panas.',
    emoji: '🍵',
    gradient: gradient('#3f5b32', '#a8c686'),
    available: true,
  },
  {
    id: 'non-chocolate',
    name: 'Dark Chocolate',
    category: 'Non-Kopi',
    price: 27000,
    description: 'Cokelat hitam pekat yang lembut, cocok untuk pecinta rasa pahit manis.',
    emoji: '🍫',
    gradient: gradient('#123c2d', '#2a6a50'),
    available: true,
  },
  {
    id: 'non-teh-lemon',
    name: 'Teh Lemon Madu',
    category: 'Non-Kopi',
    price: 20000,
    description: 'Teh hitam segar dengan lemon dan madu, disajikan hangat atau es.',
    emoji: '🍋',
    gradient: gradient('#3f5b32', '#b9d99b'),
    available: true,
  },
  {
    id: 'non-air-mineral',
    name: 'Air Mineral',
    category: 'Non-Kopi',
    price: 8000,
    description: 'Air mineral dingin 600 ml untuk menemani santapan Anda.',
    emoji: '💧',
    gradient: gradient('#2f7d6b', '#a9ddc9'),
    available: true,
  },
  {
    id: 'makan-nasi-goreng',
    name: 'Nasi Goreng Ngoffe',
    category: 'Makanan',
    price: 35000,
    description: 'Nasi goreng rempah dengan telur mata sapi, ayam suwir, dan kerupuk.',
    emoji: '🍚',
    gradient: gradient('#1f5c45', '#8fc4a4'),
    available: true,
  },
  {
    id: 'makan-mie-goreng',
    name: 'Mie Goreng Spesial',
    category: 'Makanan',
    price: 32000,
    description: 'Mie goreng dengan bakso, sayuran, telur, dan bawang goreng.',
    emoji: '🍜',
    gradient: gradient('#1b513d', '#7fbf9f'),
    available: true,
  },
  {
    id: 'makan-ayam-geprek',
    name: 'Ayam Geprek Sambal Ijo',
    category: 'Makanan',
    price: 30000,
    description: 'Ayam crispy digeprek sambal ijo, nasi hangat dan lalapan segar.',
    emoji: '🍗',
    gradient: gradient('#14442f', '#6fbf95'),
    available: true,
  },
  {
    id: 'makan-sandwich',
    name: 'Club Sandwich',
    category: 'Makanan',
    price: 28000,
    description: 'Roti panggang, ayam smoked, telur, selada, dan saus mayo spesial.',
    emoji: '🥪',
    gradient: gradient('#2a5c46', '#bfe0cf'),
    available: true,
  },
  {
    id: 'makan-fries',
    name: 'French Fries',
    category: 'Makanan',
    price: 22000,
    description: 'Kentang goreng renyah dengan saus tomat dan mayo rumahan.',
    emoji: '🍟',
    gradient: gradient('#3f5b32', '#b9d99b'),
    available: true,
  },
  {
    id: 'camilan-croissant',
    name: 'Butter Croissant',
    category: 'Camilan',
    price: 25000,
    description: 'Croissant berlapis mentega, dipanggang segar setiap pagi.',
    emoji: '🥐',
    gradient: gradient('#296e5e', '#c2d6ca'),
    available: true,
  },
  {
    id: 'camilan-cheesecake',
    name: 'Cheesecake Slice',
    category: 'Camilan',
    price: 32000,
    description: 'Cheesecake lembut dengan saus berry dan biskuit dasar renyah.',
    emoji: '🍰',
    gradient: gradient('#3b7a63', '#d7ebe0'),
    available: true,
  },
  {
    id: 'camilan-pancake',
    name: 'Honey Pancake',
    category: 'Camilan',
    price: 30000,
    description: 'Tumpukan pancake hangat dengan madu, butter, dan buah segar.',
    emoji: '🥞',
    gradient: gradient('#1f5c45', '#a9ddc9'),
    available: true,
  },
];

const staffSeed: StaffMember[] = [
  {
    id: 'staff-kasir-1',
    name: 'Rina Kasir',
    email: 'kasir@ngoffe.id',
    password: 'kasir123',
    role: 'kasir',
    active: true,
  },
  {
    id: 'staff-kasir-2',
    name: 'Doni Kasir',
    email: 'doni@ngoffe.id',
    password: 'kasir123',
    role: 'kasir',
    active: true,
  },
  {
    id: 'staff-kitchen-1',
    name: 'Budi Dapur',
    email: 'kitchen@ngoffe.id',
    password: 'kitchen123',
    role: 'kitchen',
    active: true,
  },
  {
    id: 'staff-admin-1',
    name: 'Admin Ngoffe',
    email: 'admin@ngoffe.id',
    password: 'admin123',
    role: 'admin',
    active: true,
  },
];

const roomsSeed: Room[] = [
  ...[101, 102, 103, 104, 105].map((number) => ({
    id: `room-${number}`,
    number: String(number),
    floor: 1,
    token: `NGF-RM-${number}-8F2A`,
    active: true,
  })),
  ...[201, 202, 203, 204, 205].map((number) => ({
    id: `room-${number}`,
    number: String(number),
    floor: 2,
    token: `NGF-RM-${number}-C41B`,
    active: true,
  })),
  ...[301, 302, 303, 304, 305].map((number) => ({
    id: `room-${number}`,
    number: String(number),
    floor: 3,
    token: `NGF-RM-${number}-A97D`,
    active: true,
  })),
];

const stockSeed: StockItem[] = [
  { id: 'stock-biji-kopi', name: 'Biji Kopi Arabika', unit: 'kg', qty: 8, min: 5 },
  { id: 'stock-susu', name: 'Susu UHT', unit: 'liter', qty: 12, min: 10 },
  { id: 'stock-gula-aren', name: 'Gula Aren', unit: 'kg', qty: 3, min: 4 },
  { id: 'stock-matcha', name: 'Matcha Powder', unit: 'kg', qty: 1.2, min: 1 },
  { id: 'stock-beras', name: 'Beras Premium', unit: 'kg', qty: 20, min: 10 },
  { id: 'stock-ayam', name: 'Ayam Fillet', unit: 'kg', qty: 4, min: 5 },
  { id: 'stock-keju', name: 'Keju Cheddar', unit: 'kg', qty: 2, min: 1 },
  { id: 'stock-tepung', name: 'Tepung Terigu', unit: 'kg', qty: 15, min: 8 },
  { id: 'stock-cokelat', name: 'Cokelat Bubuk', unit: 'kg', qty: 2.5, min: 2 },
  { id: 'stock-air', name: 'Air Mineral', unit: 'botol', qty: 48, min: 24 },
  { id: 'stock-cup', name: 'Cup Takeaway', unit: 'pcs', qty: 120, min: 100 },
  { id: 'stock-kemasan', name: 'Kemasan Makanan', unit: 'pcs', qty: 80, min: 100 },
];

const settingsSeed: Settings = {
  cafeName: 'Ngoffe ID',
  tagline: 'Café & Hotel Experience',
  address: 'Jl. Kopi Senja No. 12, Bandung, Jawa Barat',
  phone: '+62 812-3456-7890',
  email: 'hello@ngoffe.id',
  openHours: '07.00 – 22.00 WIB',
  qrisMerchant: 'NGOFFE ID • 9360 0012 3456',
};

const flow: OrderStatus[] = [
  'menunggu_pembayaran',
  'menunggu_validasi',
  'diproses',
  'siap_diantar',
  'diantar',
  'selesai',
];

const actorFor = (status: OrderStatus) => {
  if (status === 'menunggu_pembayaran') return 'Tamu';
  if (status === 'menunggu_validasi') return 'Tamu';
  if (status === 'diproses') return 'Kasir';
  if (status === 'siap_diantar') return 'Kitchen';
  return 'Kasir';
};

const buildTimeline = (status: OrderStatus, createdAt: Date): TimelineEntry[] => {
  if (status === 'dibatalkan') {
    return [
      {
        status: 'menunggu_pembayaran',
        at: createdAt.toISOString(),
        by: 'Tamu',
      },
      {
        status: 'dibatalkan',
        at: new Date(createdAt.getTime() + 2 * 60000).toISOString(),
        by: 'Kasir',
        note: 'Dibatalkan oleh kasir',
      },
    ];
  }

  const index = flow.indexOf(status);
  return flow.slice(0, index + 1).map((entry, i) => ({
    status: entry,
    at: new Date(createdAt.getTime() + i * 3 * 60000).toISOString(),
    by: actorFor(entry),
  }));
};

const lineFor = (menuId: string, qty: number, note = ''): OrderLine => {
  const menu = menuSeed.find((item) => item.id === menuId)!;
  return { menuId, name: menu.name, price: menu.price, qty, note };
};

const makeOrder = (options: {
  sequence: number;
  minutesAgo: number;
  room: string;
  guestName: string;
  items: OrderLine[];
  payment: PaymentMethod;
  status: OrderStatus;
  proofName?: string;
}): Order => {
  const createdAt = new Date(Date.now() - options.minutesAgo * 60000);
  const total = options.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    id: `order-seed-${options.sequence}`,
    code: `NGF-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(
      createdAt.getDate(),
    ).padStart(2, '0')}-${String(options.sequence).padStart(4, '0')}`,
    room: options.room,
    guestName: options.guestName,
    items: options.items,
    total,
    payment: options.payment,
    proofName: options.proofName,
    status: options.status,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    timeline: buildTimeline(options.status, createdAt),
  };
};

const orderSeed = (): Order[] => [
  makeOrder({
    sequence: 1,
    minutesAgo: 12,
    room: '204',
    guestName: 'Ayu',
    items: [lineFor('kopi-cappuccino', 2), lineFor('camilan-croissant', 1)],
    payment: 'qris',
    status: 'diproses',
    proofName: 'bukti-transfer-ayu.jpg',
  }),
  makeOrder({
    sequence: 2,
    minutesAgo: 6,
    room: '101',
    guestName: 'Bima',
    items: [lineFor('makan-nasi-goreng', 1), lineFor('kopi-americano', 1)],
    payment: 'cash',
    status: 'menunggu_validasi',
  }),
  makeOrder({
    sequence: 3,
    minutesAgo: 25,
    room: '305',
    guestName: 'Citra',
    items: [lineFor('non-matcha', 2), lineFor('camilan-cheesecake', 1)],
    payment: 'qris',
    status: 'siap_diantar',
    proofName: 'bukti-qris-citra.jpg',
  }),
  makeOrder({
    sequence: 4,
    minutesAgo: 90,
    room: '202',
    guestName: 'Dewi',
    items: [lineFor('kopi-gula-aren', 1), lineFor('makan-fries', 1)],
    payment: 'cash',
    status: 'selesai',
  }),
  makeOrder({
    sequence: 5,
    minutesAgo: 2,
    room: '110',
    guestName: 'Eko',
    items: [lineFor('kopi-latte', 1), lineFor('camilan-pancake', 1)],
    payment: 'qris',
    status: 'menunggu_pembayaran',
  }),
  makeOrder({
    sequence: 6,
    minutesAgo: 150,
    room: '301',
    guestName: 'Fajar',
    items: [lineFor('makan-ayam-geprek', 2), lineFor('non-teh-lemon', 2)],
    payment: 'qris',
    status: 'selesai',
    proofName: 'bukti-qris-fajar.jpg',
  }),
  makeOrder({
    sequence: 7,
    minutesAgo: 40,
    room: '205',
    guestName: 'Gita',
    items: [lineFor('non-chocolate', 1), lineFor('makan-sandwich', 1)],
    payment: 'cash',
    status: 'diantar',
  }),
  makeOrder({
    sequence: 8,
    minutesAgo: 70,
    room: '103',
    guestName: 'Hana',
    items: [lineFor('kopi-mocha', 1), lineFor('camilan-croissant', 2)],
    payment: 'qris',
    status: 'selesai',
    proofName: 'bukti-qris-hana.jpg',
  }),
];

export const createInitialState = (): AppState => ({
  menu: menuSeed,
  orders: orderSeed(),
  staff: staffSeed,
  rooms: roomsSeed,
  stock: stockSeed,
  settings: settingsSeed,
  session: null,
  cart: [],
  room: '',
  guestName: '',
});

export const nextOrderCode = (orders: Order[]): string => orderCode(orders);
