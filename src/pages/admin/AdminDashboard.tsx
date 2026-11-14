import { IonButton, IonIcon, useIonRouter } from '@ionic/react';
import {
  arrowForwardOutline,
  bedOutline,
  cubeOutline,
  flameOutline,
  peopleOutline,
  receiptOutline,
  restaurantOutline,
  statsChartOutline,
  timeOutline,
  warningOutline,
  walletOutline,
} from 'ionicons/icons';
import React from 'react';

import { CountUp } from '../../components/CountUp';
import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import { isToday, orderItemCount, rupiah, statusLabel, timeAgo } from '../../utils/format';

const MODULES = [
  {
    href: '/admin/menu',
    icon: restaurantOutline,
    title: 'Menu & Kategori',
    text: 'Tambah, ubah harga, atur ketersediaan.',
  },
  {
    href: '/admin/rooms',
    icon: bedOutline,
    title: 'Kamar & QR',
    text: 'Kelola kamar dan QR pemesanan.',
  },
  {
    href: '/admin/staff',
    icon: peopleOutline,
    title: 'Staf & Akses',
    text: 'Atur akun kasir, kitchen, admin.',
  },
  {
    href: '/admin/stock',
    icon: cubeOutline,
    title: 'Stok & Resep',
    text: 'Pantau bahan baku dan minimum stok.',
  },
  {
    href: '/admin/reports',
    icon: statsChartOutline,
    title: 'Laporan',
    text: 'Pendapatan, menu terlaris, pembayaran.',
  },
  {
    href: '/admin/settings',
    icon: walletOutline,
    title: 'Pengaturan',
    text: 'Profil café dan pengaturan sistem.',
  },
];

const AdminDashboard: React.FC = () => {
  const { state, setOrderStatus } = useApp();
  const router = useIonRouter();

  const orders = [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const todayOrders = orders.filter((order) => isToday(order.createdAt));
  const paidToday = todayOrders.filter(
    (order) => order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran',
  );
  const revenueToday = paidToday.reduce((total, order) => total + order.total, 0);
  const activeOrders = orders.filter((order) =>
    ['menunggu_validasi', 'diproses', 'siap_diantar', 'diantar'].includes(order.status),
  );
  const pendingValidation = orders.filter((order) => order.status === 'menunggu_validasi').length;
  const lowStock = state.stock.filter((item) => item.qty <= item.min);
  const avgOrder = paidToday.length ? Math.round(revenueToday / paidToday.length) : 0;
  const itemsSold = paidToday.reduce((total, order) => total + orderItemCount(order), 0);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const series = days.map((date) => {
    const total = orders
      .filter(
        (order) =>
          order.status !== 'dibatalkan' &&
          order.status !== 'menunggu_pembayaran' &&
          new Date(order.createdAt).toDateString() === date.toDateString(),
      )
      .reduce((sum, order) => sum + order.total, 0);
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      total,
    };
  });
  const maxSeries = Math.max(...series.map((item) => item.total), 1);

  return (
    <StaffShell
      title="Dashboard Admin"
      subtitle={`Ringkasan operasional ${state.settings.cafeName} hari ini.`}
      actions={
        <IonButton size="small" routerLink="/admin/reports">
          <IonIcon slot="start" icon={statsChartOutline} />
          Buka Laporan
        </IonButton>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={walletOutline} />
          </div>
          <div className="kpi-label">Pendapatan Hari Ini</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            <CountUp value={revenueToday} format={rupiah} />
          </div>
          <div className="kpi-note">{paidToday.length} transaksi tervalidasi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={receiptOutline} />
          </div>
          <div className="kpi-label">Pesanan Hari Ini</div>
          <div className="kpi-value">
            <CountUp value={todayOrders.length} />
          </div>
          <div className="kpi-note">{itemsSold} item terjual</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={timeOutline} />
          </div>
          <div className="kpi-label">Pesanan Aktif</div>
          <div className="kpi-value">
            <CountUp value={activeOrders.length} />
          </div>
          <div className="kpi-note">Diproses &amp; menunggu validasi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={statsChartOutline} />
          </div>
          <div className="kpi-label">Rata-rata Pesanan</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            <CountUp value={avgOrder} format={rupiah} />
          </div>
          <div className="kpi-note">Per transaksi hari ini</div>
        </div>
      </div>

      <div className="grid-auto" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="panel">
            <div className="row-between">
              <div>
                <h3 className="panel-title">Tren pendapatan 7 hari</h3>
                <p className="panel-sub">Pesanan tervalidasi &amp; selesai</p>
              </div>
              <span className="badge-soft">7 hari</span>
            </div>
            <div style={{ marginTop: 16 }}>
              {series.map((item) => (
                <div className="bar-row" key={item.label}>
                  <span className="muted small">{item.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(4, (item.total / maxSeries) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{item.total ? `${Math.round(item.total / 1000)}k` : '0'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="row-between" style={{ marginBottom: 8 }}>
              <div>
                <h3 className="panel-title">Pesanan terbaru</h3>
                <p className="panel-sub">5 pesanan terakhir masuk</p>
              </div>
              <IonButton fill="clear" size="small" routerLink="/staff/kasir">
                Lihat semua <IonIcon slot="end" icon={arrowForwardOutline} />
              </IonButton>
            </div>
            {orders.slice(0, 5).map((order) => (
              <div
                className="manage-row"
                key={order.id}
                onClick={() => router.push(`/staff/kasir/order/${order.id}`)}
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <div className="manage-thumb" style={{ background: '#e6f1ea' }}>
                  🧾
                </div>
                <div className="grow">
                  <div className="row-between wrap">
                    <div>
                      <div className="order-code">{order.code}</div>
                      <div className="order-meta">
                        Kamar {order.room} • {timeAgo(order.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={order.status} label={statusLabel[order.status]} />
                  </div>
                </div>
                <strong className="order-total">{rupiah(order.total)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="row-between">
              <h3 className="panel-title">Perlu perhatian</h3>
              <IonIcon icon={warningOutline} color="warning" />
            </div>
            <div className="stack-sm" style={{ marginTop: 10 }}>
              <div className="pay-option" style={{ cursor: 'default' }}>
                <span className="pay-icon">⏳</span>
                <div className="grow">
                  <strong>{pendingValidation} pembayaran menunggu validasi</strong>
                  <span>Segera periksa agar pesanan masuk dapur.</span>
                </div>
                <IonButton size="small" fill="clear" routerLink="/staff/kasir">
                  Buka
                </IonButton>
              </div>
              <div className="pay-option" style={{ cursor: 'default' }}>
                <span className="pay-icon">📦</span>
                <div className="grow">
                  <strong>{lowStock.length} bahan baku menipis</strong>
                  <span>
                    {lowStock.length
                      ? lowStock
                          .map((item) => item.name)
                          .slice(0, 2)
                          .join(', ')
                      : 'Semua stok aman.'}
                  </span>
                </div>
                <IonButton size="small" fill="clear" routerLink="/admin/stock">
                  Buka
                </IonButton>
              </div>
              <div className="pay-option" style={{ cursor: 'default' }}>
                <span className="pay-icon">🛏️</span>
                <div className="grow">
                  <strong>{state.rooms.filter((room) => room.active).length} kamar terhubung</strong>
                  <span>QR aktif untuk pemesanan tamu.</span>
                </div>
                <IonButton size="small" fill="clear" routerLink="/admin/rooms">
                  Buka
                </IonButton>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Aksi cepat</h3>
            <div className="stack-sm" style={{ marginTop: 10 }}>
              {MODULES.slice(0, 4).map((module) => (
                <div
                  key={module.href}
                  className="manage-row"
                  onClick={() => router.push(module.href)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="manage-thumb" style={{ background: '#e6f1ea' }}>
                    <IonIcon icon={module.icon} color="primary" />
                  </div>
                  <div className="grow">
                    <strong className="small">{module.title}</strong>
                    <div className="muted small">{module.text}</div>
                  </div>
                  <IonIcon icon={arrowForwardOutline} color="medium" />
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ background: '#eaf3ed', borderStyle: 'dashed' }}>
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <IonIcon icon={flameOutline} color="primary" />
              <div>
                <strong className="small">Demo cepat</strong>
                <p className="muted small" style={{ margin: '4px 0 8px', lineHeight: 1.55 }}>
                  Buat pesanan dari sisi tamu, lalu validasi di kasir untuk melihat alur lengkap.
                </p>
                <div className="row wrap">
                  <IonButton size="small" fill="outline" routerLink="/order">
                    Pesan sebagai tamu
                  </IonButton>
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => {
                      const target = orders.find((order) => order.status === 'menunggu_validasi');
                      if (target) {
                        setOrderStatus(target.id, 'diproses', 'Admin', 'Divalidasi dari dashboard admin');
                        router.push(`/staff/kasir/order/${target.id}`);
                      }
                    }}
                  >
                    Validasi contoh
                  </IonButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
};

export default AdminDashboard;
