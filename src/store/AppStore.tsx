import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createInitialState, withRecipes } from '../data/seed';
import type {
  AppState,
  AuditEntry,
  CartLine,
  MenuItem,
  Order,
  OrderStatus,
  PaymentMethod,
  RefundMethod,
  Room,
  Session,
  Settings,
  Shift,
  StaffMember,
  StockItem,
} from '../types';
import { orderCode } from '../utils/format';
import { prepItemsFor } from '../utils/kitchen';
import { applyConsumption, consumptionFor, restoreConsumption, roundQty } from '../utils/recipes';

const STORAGE_KEY = 'ngoffe-ionic-state-v1';
const ORDER_SYNC_CHANNEL = 'ngoffe-orders-sync-v1';
const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';

const loadState = (): AppState => {
  const seed = createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.menu || !parsed.orders) return seed;
    const savedStock = Array.isArray(parsed.stock) ? parsed.stock : [];
    // Bahan baru (mis. Kentang Beku) ditambahkan saat versi aplikasi naik tanpa menghapus data lama.
    const missingStock = seed.stock.filter((item) => !savedStock.some((saved) => saved.id === item.id));
    return {
      ...seed,
      ...parsed,
      menu: withRecipes(parsed.menu),
      stock: [...savedStock, ...missingStock],
      settings: { ...seed.settings, ...parsed.settings },
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : [],
    } as AppState;
  } catch {
    return seed;
  }
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface LoginResult {
  ok: boolean;
  role?: Session['role'];
  message?: string;
}

interface VoidOptions {
  reason: string;
  by: string;
  refund: RefundMethod;
  amount: number;
}

interface AppContextValue {
  state: AppState;
  cartCount: number;
  cartTotal: number;
  addToCart: (menuId: string) => void;
  decrementCart: (menuId: string) => void;
  setQty: (menuId: string, qty: number) => void;
  removeFromCart: (menuId: string) => void;
  /** Kembalikan baris yang dihapus, misalnya dari tombol Undo. */
  restoreCartLine: (line: CartLine, index: number) => void;
  setLineNote: (menuId: string, note: string) => void;
  clearCart: () => void;
  /** Tambahkan ulang item pesanan lama ke keranjang; mengembalikan jumlah item yang masuk. */
  reorder: (orderId: string) => number;
  /** Simpan rating bintang + komentar tamu (sekali per pesanan). */
  submitFeedback: (orderId: string, rating: number, comment: string) => void;
  setRoom: (room: string) => void;
  setGuestName: (name: string) => void;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  placeOrder: (payment: PaymentMethod) => Order | null;
  uploadProof: (orderId: string, fileName: string) => void;
  setOrderStatus: (orderId: string, status: OrderStatus, by: string, note?: string) => void;
  cancelOrder: (orderId: string, reason: string, by: string) => void;
  voidOrder: (orderId: string, options: VoidOptions) => void;
  startKitchenItem: (orderId: string, menuId: string) => void;
  finishKitchenItem: (orderId: string, menuId: string) => void;
  startAllKitchenItems: (orderId: string) => void;
  openShift: (openingCash: number) => Shift | null;
  closeShift: (closingCash: number, note?: string) => void;
  saveMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuAvailability: (id: string) => void;
  saveRoom: (room: Room) => void;
  deleteRoom: (id: string) => void;
  saveStaff: (member: StaffMember) => void;
  deleteStaff: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  saveStock: (item: StockItem) => void;
  deleteStock: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
  orderByCode: (code: string) => Order | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const remoteOrdersRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage bisa penuh (mis. mode privat); abaikan agar aplikasi tetap jalan.
    }
  }, [state]);

  // Sinkronkan daftar pesanan antar-tab (mis. tab tamu, kasir, dan dapur).
  const applyRemoteOrders = useCallback((orders: Order[]) => {
    setState((prev) => {
      if (JSON.stringify(prev.orders) === JSON.stringify(orders)) return prev;
      remoteOrdersRef.current = true;
      return { ...prev, orders };
    });
  }, []);

  useEffect(() => {
    if (!hasBroadcastChannel) return undefined;
    const channel = new BroadcastChannel(ORDER_SYNC_CHANNEL);
    channel.onmessage = (event: MessageEvent<{ orders?: Order[] }>) => {
      if (Array.isArray(event.data?.orders)) applyRemoteOrders(event.data.orders);
    };
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [applyRemoteOrders]);

  useEffect(() => {
    if (hasBroadcastChannel) return undefined;
    // Cadangan bila BroadcastChannel tidak tersedia: event storage tetap tersinkron antar-tab.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<AppState>;
        if (Array.isArray(parsed.orders)) applyRemoteOrders(parsed.orders);
      } catch {
        // Abaikan payload rusak dari tab lain.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyRemoteOrders]);

  useEffect(() => {
    if (remoteOrdersRef.current) {
      remoteOrdersRef.current = false;
      return;
    }
    channelRef.current?.postMessage({ orders: state.orders, at: Date.now() });
  }, [state.orders]);

  const addToCart = useCallback((menuId: string) => {
    setState((prev) => {
      const existing = prev.cart.find((line) => line.menuId === menuId);
      const cart: CartLine[] = existing
        ? prev.cart.map((line) => (line.menuId === menuId ? { ...line, qty: line.qty + 1 } : line))
        : [...prev.cart, { menuId, qty: 1, note: '' }];
      return { ...prev, cart };
    });
  }, []);

  const decrementCart = useCallback((menuId: string) => {
    setState((prev) => {
      const cart = prev.cart
        .map((line) => (line.menuId === menuId ? { ...line, qty: line.qty - 1 } : line))
        .filter((line) => line.qty > 0);
      return { ...prev, cart };
    });
  }, []);

  const setQty = useCallback((menuId: string, qty: number) => {
    setState((prev) => {
      const cart = prev.cart
        .map((line) => (line.menuId === menuId ? { ...line, qty: Math.max(0, qty) } : line))
        .filter((line) => line.qty > 0);
      return { ...prev, cart };
    });
  }, []);

  const removeFromCart = useCallback((menuId: string) => {
    setState((prev) => ({ ...prev, cart: prev.cart.filter((line) => line.menuId !== menuId) }));
  }, []);

  const restoreCartLine = useCallback((line: CartLine, index: number) => {
    setState((prev) => {
      if (prev.cart.some((item) => item.menuId === line.menuId)) return prev;
      const cart = [...prev.cart];
      cart.splice(Math.max(0, Math.min(index, cart.length)), 0, line);
      return { ...prev, cart };
    });
  }, []);

  const setLineNote = useCallback((menuId: string, note: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((line) => (line.menuId === menuId ? { ...line, note } : line)),
    }));
  }, []);

  const clearCart = useCallback(() => setState((prev) => ({ ...prev, cart: [] })), []);

  const reorder = useCallback(
    (orderId: string): number => {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return 0;
      // Menu yang sudah habis dilewati agar keranjang tetap valid.
      const available = order.items.filter((item) => state.menu.find((menu) => menu.id === item.menuId)?.available);
      if (!available.length) return 0;

      setState((prev) => {
        const cart = [...prev.cart];
        available.forEach((item) => {
          const index = cart.findIndex((line) => line.menuId === item.menuId);
          if (index >= 0) {
            cart[index] = { ...cart[index], qty: cart[index].qty + item.qty };
          } else {
            cart.push({ menuId: item.menuId, qty: item.qty, note: item.note });
          }
        });
        return { ...prev, cart };
      });

      return available.reduce((total, item) => total + item.qty, 0);
    },
    [state.menu, state.orders],
  );

  const submitFeedback = useCallback((orderId: string, rating: number, comment: string) => {
    const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId && !order.feedback
          ? { ...order, feedback: { rating: safeRating, comment: comment.trim() || undefined, at } }
          : order,
      ),
    }));
  }, []);

  const setRoom = useCallback((room: string) => setState((prev) => ({ ...prev, room })), []);

  const setGuestName = useCallback((guestName: string) => setState((prev) => ({ ...prev, guestName })), []);

  const login = useCallback(
    (email: string, password: string): LoginResult => {
      const member = state.staff.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!member) return { ok: false, message: 'Email tidak terdaftar.' };
      if (!member.active) return { ok: false, message: 'Akun ini sudah dinonaktifkan.' };
      if (member.password !== password) return { ok: false, message: 'Password salah.' };
      setState((prev) => ({
        ...prev,
        session: { staffId: member.id, name: member.name, role: member.role },
      }));
      return { ok: true, role: member.role };
    },
    [state.staff],
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  const cartTotal = useMemo(
    () =>
      state.cart.reduce((total, line) => {
        const menu = state.menu.find((item) => item.id === line.menuId);
        return total + (menu ? menu.price * line.qty : 0);
      }, 0),
    [state.cart, state.menu],
  );

  const cartCount = useMemo(() => state.cart.reduce((total, line) => total + line.qty, 0), [state.cart]);

  const placeOrder = useCallback(
    (payment: PaymentMethod): Order | null => {
      if (!state.cart.length || !state.room) return null;
      const items = state.cart
        .map((line) => {
          const menu = state.menu.find((item) => item.id === line.menuId);
          if (!menu) return null;
          return {
            menuId: menu.id,
            name: menu.name,
            price: menu.price,
            qty: line.qty,
            note: line.note.trim(),
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);

      if (!items.length) return null;

      const now = new Date();
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const order: Order = {
        id: uid('order'),
        code: orderCode(state.orders, now),
        room: state.room,
        guestName: state.guestName.trim() || 'Tamu Hotel',
        items,
        total,
        payment,
        status: 'menunggu_pembayaran',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        timeline: [
          {
            status: 'menunggu_pembayaran',
            at: now.toISOString(),
            by: 'Tamu',
            note: payment === 'qris' ? 'Menunggu pembayaran QRIS' : 'Bayar cash saat antar',
          },
        ],
      };

      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        cart: [],
      }));
      return order;
    },
    [state.cart, state.guestName, state.menu, state.orders, state.room],
  );

  const uploadProof = useCallback((orderId: string, fileName: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              proofName: fileName,
              status: 'menunggu_validasi',
              updatedAt: now,
              timeline: [
                ...order.timeline,
                {
                  status: 'menunggu_validasi',
                  at: now,
                  by: 'Tamu',
                  note: 'Bukti pembayaran diunggah',
                },
              ],
            }
          : order,
      ),
    }));
  }, []);

  const setOrderStatus = useCallback((orderId: string, status: OrderStatus, by: string, note?: string) => {
    const now = new Date().toISOString();
    setState((prev) => {
      let stock = prev.stock;
      const orders = prev.orders.map((order) => {
        if (order.id !== orderId || order.status === status) return order;

        // Pemotongan bahan hanya sekali, saat pesanan pertama kali masuk dapur.
        const firstTimeInKitchen =
          status === 'diproses' && !order.timeline.some((entry) => entry.status === 'diproses');
        if (firstTimeInKitchen) {
          stock = applyConsumption(stock, consumptionFor(order.items, prev.menu));
        }

        return {
          ...order,
          status,
          updatedAt: now,
          timeline: [...order.timeline, { status, at: now, by, note }],
        };
      });
      return { ...prev, orders, stock };
    });
  }, []);

  const cancelOrder = useCallback((orderId: string, reason: string, by: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'dibatalkan' as OrderStatus,
              cancelReason: reason,
              updatedAt: now,
              timeline: [...order.timeline, { status: 'dibatalkan' as OrderStatus, at: now, by, note: reason }],
            }
          : order,
      ),
    }));
  }, []);

  /**
   * Void/refund pesanan dengan alasan wajib. Bahan yang sudah terpakai
   * dikembalikan ke stok, dan setiap aksi dicatat di audit trail.
   */
  const voidOrder = useCallback((orderId: string, options: VoidOptions) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const order = prev.orders.find((item) => item.id === orderId);
      if (!order || order.status === 'dibatalkan') return prev;

      const reason = options.reason.trim() || 'Tanpa alasan';
      const amount = options.refund === 'none' ? 0 : Math.max(0, Math.min(roundQty(options.amount), order.total));
      const inKitchen = order.timeline.some((entry) => entry.status === 'diproses');
      const restore = inKitchen && !order.stockRestored;
      const stock = restore ? restoreConsumption(prev.stock, consumptionFor(order.items, prev.menu)) : prev.stock;

      const audit: AuditEntry = {
        id: uid('audit'),
        at: now,
        by: options.by,
        action: amount > 0 ? 'refund' : 'void',
        orderId: order.id,
        orderCode: order.code,
        amount,
        reason,
        method: options.refund,
      };

      const note =
        amount > 0 ? `Void/refund ${options.refund.toUpperCase()} ${amount} • ${reason}` : `Void pesanan • ${reason}`;

      return {
        ...prev,
        stock,
        audits: [audit, ...prev.audits],
        orders: prev.orders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                status: 'dibatalkan' as OrderStatus,
                cancelReason: reason,
                voidReason: reason,
                refundAmount: amount,
                refundMethod: options.refund,
                voidedAt: now,
                stockRestored: item.stockRestored || restore,
                updatedAt: now,
                timeline: [...item.timeline, { status: 'dibatalkan' as OrderStatus, at: now, by: options.by, note }],
              }
            : item,
        ),
      };
    });
  }, []);

  const startKitchenItem = useCallback((orderId: string, menuId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = prepItemsFor(order).map((item) =>
          item.menuId === menuId && !item.startedAt ? { ...item, startedAt: now } : item,
        );
        return { ...order, prep: { items }, updatedAt: now };
      }),
    }));
  }, []);

  const finishKitchenItem = useCallback((orderId: string, menuId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = prepItemsFor(order).map((item) =>
          item.menuId === menuId
            ? { ...item, startedAt: item.startedAt ?? now, finishedAt: item.finishedAt ?? now }
            : item,
        );
        return { ...order, prep: { items }, updatedAt: now };
      }),
    }));
  }, []);

  const startAllKitchenItems = useCallback((orderId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = prepItemsFor(order).map((item) => (item.startedAt ? item : { ...item, startedAt: now }));
        return { ...order, prep: { items }, updatedAt: now };
      }),
    }));
  }, []);

  const openShift = useCallback(
    (openingCash: number): Shift | null => {
      const session = state.session;
      if (!session) return null;
      const existing = state.shifts.find((shift) => shift.status === 'open' && shift.staffId === session.staffId);
      if (existing) return existing;

      const shift: Shift = {
        id: uid('shift'),
        staffId: session.staffId,
        staffName: session.name,
        openedAt: new Date().toISOString(),
        openingCash: Math.max(0, roundQty(openingCash)),
        status: 'open',
      };
      setState((prev) => ({ ...prev, shifts: [shift, ...prev.shifts] }));
      return shift;
    },
    [state.session, state.shifts],
  );

  const closeShift = useCallback(
    (closingCash: number, note?: string) => {
      const session = state.session;
      if (!session) return;
      const now = new Date().toISOString();
      setState((prev) => {
        const open = prev.shifts.find((shift) => shift.status === 'open' && shift.staffId === session.staffId);
        if (!open) return prev;

        const scoped = prev.orders.filter(
          (order) =>
            order.createdAt >= open.openedAt && order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran',
        );
        const cashSales = scoped
          .filter((order) => order.payment === 'cash')
          .reduce((total, order) => total + order.total, 0);
        const qrisSales = scoped
          .filter((order) => order.payment === 'qris')
          .reduce((total, order) => total + order.total, 0);

        return {
          ...prev,
          shifts: prev.shifts.map((shift) =>
            shift.id === open.id
              ? {
                  ...shift,
                  status: 'closed',
                  closedAt: now,
                  closingCash: Math.max(0, roundQty(closingCash)),
                  expectedCash: roundQty(open.openingCash + cashSales),
                  cashSales: roundQty(cashSales),
                  qrisSales: roundQty(qrisSales),
                  orderCount: scoped.length,
                  note: note?.trim() || undefined,
                }
              : shift,
          ),
        };
      });
    },
    [state.session],
  );

  const saveMenuItem = useCallback((item: MenuItem) => {
    setState((prev) => {
      const exists = prev.menu.some((menu) => menu.id === item.id);
      return {
        ...prev,
        menu: exists ? prev.menu.map((menu) => (menu.id === item.id ? item : menu)) : [...prev.menu, item],
      };
    });
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setState((prev) => ({ ...prev, menu: prev.menu.filter((item) => item.id !== id) }));
  }, []);

  const toggleMenuAvailability = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      menu: prev.menu.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
    }));
  }, []);

  const saveRoom = useCallback((room: Room) => {
    setState((prev) => {
      const exists = prev.rooms.some((item) => item.id === room.id);
      return {
        ...prev,
        rooms: exists ? prev.rooms.map((item) => (item.id === room.id ? room : item)) : [...prev.rooms, room],
      };
    });
  }, []);

  const deleteRoom = useCallback((id: string) => {
    setState((prev) => ({ ...prev, rooms: prev.rooms.filter((room) => room.id !== id) }));
  }, []);

  const saveStaff = useCallback((member: StaffMember) => {
    setState((prev) => {
      const exists = prev.staff.some((item) => item.id === member.id);
      return {
        ...prev,
        staff: exists ? prev.staff.map((item) => (item.id === member.id ? member : item)) : [...prev.staff, member],
      };
    });
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      staff: prev.staff.filter((member) => member.id !== id),
      session: prev.session?.staffId === id ? null : prev.session,
    }));
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      stock: prev.stock.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, roundQty(item.qty + delta)) } : item,
      ),
    }));
  }, []);

  const saveStock = useCallback((item: StockItem) => {
    setState((prev) => {
      const exists = prev.stock.some((stock) => stock.id === item.id);
      return {
        ...prev,
        stock: exists ? prev.stock.map((stock) => (stock.id === item.id ? item : stock)) : [...prev.stock, item],
      };
    });
  }, []);

  const deleteStock = useCallback((id: string) => {
    setState((prev) => ({ ...prev, stock: prev.stock.filter((item) => item.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState());
  }, []);

  const orderByCode = useCallback(
    (code: string) => state.orders.find((order) => order.code.toLowerCase() === code.trim().toLowerCase()),
    [state.orders],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      cartCount,
      cartTotal,
      addToCart,
      decrementCart,
      setQty,
      removeFromCart,
      restoreCartLine,
      setLineNote,
      clearCart,
      reorder,
      submitFeedback,
      setRoom,
      setGuestName,
      login,
      logout,
      placeOrder,
      uploadProof,
      setOrderStatus,
      cancelOrder,
      voidOrder,
      startKitchenItem,
      finishKitchenItem,
      startAllKitchenItems,
      openShift,
      closeShift,
      saveMenuItem,
      deleteMenuItem,
      toggleMenuAvailability,
      saveRoom,
      deleteRoom,
      saveStaff,
      deleteStaff,
      adjustStock,
      saveStock,
      deleteStock,
      updateSettings,
      resetDemo,
      orderByCode,
    }),
    [
      state,
      cartCount,
      cartTotal,
      addToCart,
      decrementCart,
      setQty,
      removeFromCart,
      restoreCartLine,
      setLineNote,
      clearCart,
      reorder,
      submitFeedback,
      setRoom,
      setGuestName,
      login,
      logout,
      placeOrder,
      uploadProof,
      setOrderStatus,
      cancelOrder,
      voidOrder,
      startKitchenItem,
      finishKitchenItem,
      startAllKitchenItems,
      openShift,
      closeShift,
      saveMenuItem,
      deleteMenuItem,
      toggleMenuAvailability,
      saveRoom,
      deleteRoom,
      saveStaff,
      deleteStaff,
      adjustStock,
      saveStock,
      deleteStock,
      updateSettings,
      resetDemo,
      orderByCode,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook ini sengaja satu berkas dengan provider agar seluruh aksi mudah dipakai.
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus dipakai di dalam <AppProvider>');
  return context;
};
