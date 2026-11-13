import { IonButton, IonIcon } from '@ionic/react';
import {
  cashOutline,
  downloadOutline,
  qrCodeOutline,
  receiptOutline,
  statsChartOutline,
  walletOutline,
} from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import { formatDateTime, paymentLabel, rupiah, statusLabel } from '../../utils/format';

type Range = 'today' | 'week' | 'month' | 'all';

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: 'week', label: '7 hari' },
  { key: 'month', label: '30 hari' },
  { key: 'all', label: 'Semua' },
];

const startOfRange = (range: Range) => {
  if (range === 'all') return new Date(0);
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (range === 'week') date.setDate(date.getDate() - 6);
  if (range === 'month') date.setDate(date.getDate() - 29);
  return date;
};

const AdminReports: React.FC = () => {
  const { state } = useApp();
  const [range, setRange] = useState<Range>('week');

  const visible = useMemo(() => {
    const start = startOfRange(range);
    return state.orders.filter((order) => new Date(order.createdAt) >= start);
  }, [state.orders, range]);

  const paid = visible.filter((order) => order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran');
  const revenue = paid.reduce((total, order) => total + order.total, 0);
  const itemsSold = paid.reduce((total, order) => total + order.items.reduce((sum, item) => sum + item.qty, 0), 0);
  const avgOrder = paid.length ? Math.round(revenue / paid.length) : 0;

  const qrisTotal = paid.filter((order) => order.payment === 'qris').reduce((total, order) => total + order.total, 0);
  const cashTotal = paid.filter((order) => order.payment === 'cash').reduce((total, order) => total + order.total, 0);
  const maxPayment = Math.max(qrisTotal, cashTotal, 1);

  const menuMap = new Map<string, { name: string; qty: number; revenue: number }>();
  paid.forEach((order) => {
    order.items.forEach((item) => {
      const current = menuMap.get(item.menuId) ?? { name: item.name, qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue += item.qty * item.price;
      menuMap.set(item.menuId, current);
    });
  });
  const topMenus = [...menuMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  const maxQty = Math.max(...topMenus.map((item) => item.qty), 1);

  const categoryMap = new Map<string, number>();
  paid.forEach((order) => {
    order.items.forEach((item) => {
      const menu = state.menu.find((entry) => entry.id === item.menuId);
      const category = menu?.category ?? 'Lainnya';
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + item.qty * item.price);
    });
  });
  const categories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(...categories.map(([, value]) => value), 1);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const series = days.map((date) => {
    const total = state.orders
      .filter(
        (order) =>
          order.status !== 'dibatalkan' &&
          order.status !== 'menunggu_pembayaran' &&
          new Date(order.createdAt).toDateString() === date.toDateString(),
      )
      .reduce((sum, order) => sum + order.total, 0);
    return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), total };
  });
  const maxSeries = Math.max(...series.map((item) => item.total), 1);

  const exportCsv = () => {
    const header = ['Kode', 'Tanggal', 'Kamar', 'Tamu', 'Pembayaran', 'Status', 'Total'];
    const rows = visible.map((order) => [
      order.code,
      formatDateTime(order.createdAt),
      order.room,
      order.guestName,
      paymentLabel[order.payment],
      statusLabel[order.status],
      order.total,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `laporan-ngoffe-${range}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StaffShell
      title="Laporan & Analitik"
      subtitle="Analisis pendapatan, menu terlaris, dan metode pembayaran."
      actions={
        <IonButton size="small" fill="outline" onClick={exportCsv}>
          <IonIcon slot="start" icon={downloadOutline} />
          Ekspor CSV
        </IonButton>
      }
    >
      <div className="segmented" style={{ marginBottom: 14 }}>
        {RANGES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`segment-btn ${range === item.key ? 'active' : ''}`}
            onClick={() => setRange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={walletOutline} />
          </div>
          <div className="kpi-label">Pendapatan</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            {rupiah(revenue)}
          </div>
          <div className="kpi-note">{paid.length} transaksi tervalidasi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={receiptOutline} />
          </div>
          <div className="kpi-label">Pesanan</div>
          <div className="kpi-value">{visible.length}</div>
          <div className="kpi-note">{itemsSold} item terjual</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={statsChartOutline} />
          </div>
          <div className="kpi-label">Rata-rata</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            {rupiah(avgOrder)}
          </div>
          <div className="kpi-note">Per transaksi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={qrCodeOutline} />
          </div>
          <div className="kpi-label">QRIS vs Cash</div>
          <div className="kpi-value" style={{ fontSize: '1.05rem' }}>
            {paid.length
              ? `${Math.round((paid.filter((o) => o.payment === 'qris').length / paid.length) * 100)}% / ${Math.round(
                  (paid.filter((o) => o.payment === 'cash').length / paid.length) * 100,
                )}%`
              : '0% / 0%'}
          </div>
          <div className="kpi-note">Berdasarkan jumlah transaksi</div>
        </div>
      </div>

      <div className="grid-auto" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="panel">
            <div className="row-between">
              <div>
                <h3 className="panel-title">Tren pendapatan 7 hari</h3>
                <p className="panel-sub">Seluruh pesanan tervalidasi</p>
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
            <h3 className="panel-title">Menu terlaris</h3>
            <p className="panel-sub">Berdasarkan jumlah item terjual</p>
            <div style={{ marginTop: 14 }}>
              {topMenus.length ? (
                topMenus.map((item) => (
                  <div className="bar-row" key={item.name}>
                    <span
                      className="small"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.name}
                    </span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(6, (item.qty / maxQty) * 100)}%` }} />
                    </div>
                    <span className="bar-value">{item.qty}×</span>
                  </div>
                ))
              ) : (
                <p className="muted small">Belum ada penjualan pada rentang ini.</p>
              )}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Metode pembayaran</h3>
            <p className="panel-sub">Total nominal per metode</p>
            <div style={{ marginTop: 14 }}>
              <div className="bar-row" style={{ gridTemplateColumns: '76px 1fr 86px' }}>
                <span className="small">
                  <IonIcon icon={qrCodeOutline} color="primary" /> QRIS
                </span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(4, (qrisTotal / maxPayment) * 100)}%` }} />
                </div>
                <span className="bar-value">{rupiah(qrisTotal)}</span>
              </div>
              <div className="bar-row" style={{ gridTemplateColumns: '76px 1fr 86px' }}>
                <span className="small">
                  <IonIcon icon={cashOutline} color="primary" /> Cash
                </span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.max(4, (cashTotal / maxPayment) * 100)}%`,
                      background: 'linear-gradient(90deg,#3f8f5f,#8fc4a4)',
                    }}
                  />
                </div>
                <span className="bar-value">{rupiah(cashTotal)}</span>
              </div>
            </div>
            <div className="divider" />
            <div className="summary-row">
              <span>Total tervalidasi</span>
              <strong>{rupiah(revenue)}</strong>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Pendapatan per kategori</h3>
            <p className="panel-sub">Kontribusi tiap kategori menu</p>
            <div style={{ marginTop: 14 }}>
              {categories.length ? (
                categories.map(([category, value]) => (
                  <div className="bar-row" key={category}>
                    <span className="small">{category}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(6, (value / maxCategory) * 100)}%` }} />
                    </div>
                    <span className="bar-value">{rupiah(value)}</span>
                  </div>
                ))
              ) : (
                <p className="muted small">Belum ada data.</p>
              )}
            </div>
          </div>

          <div className="panel" style={{ background: '#eaf3ed', borderStyle: 'dashed' }}>
            <strong className="small">Catatan laporan</strong>
            <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
              Perhitungan hanya memasukkan pesanan yang sudah divalidasi (bukan menunggu pembayaran / dibatalkan).
              Ekspor CSV mengikuti rentang tanggal yang dipilih.
            </p>
          </div>
        </div>
      </div>
    </StaffShell>
  );
};

export default AdminReports;
