import { IonButton, IonIcon, useIonRouter } from '@ionic/react';
import {
  arrowForwardOutline,
  cashOutline,
  downloadOutline,
  qrCodeOutline,
  receiptOutline,
  walletOutline,
} from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { EmptyState } from '../../components/EmptyState';
import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import { formatDateTime, paymentLabel, rupiah, statusLabel } from '../../utils/format';

type Range = 'today' | 'week' | 'all';

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: 'week', label: '7 hari' },
  { key: 'all', label: 'Semua' },
];

const startOfRange = (range: Range) => {
  if (range === 'all') return new Date(0);
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (range === 'week') date.setDate(date.getDate() - 6);
  return date;
};

const KasirTransactions: React.FC = () => {
  const { state } = useApp();
  const router = useIonRouter();
  const [range, setRange] = useState<Range>('today');

  const visible = useMemo(() => {
    const start = startOfRange(range);
    return [...state.orders]
      .filter((order) => new Date(order.createdAt) >= start)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.orders, range]);

  const paid = visible.filter((order) => order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran');
  const revenue = paid.reduce((total, order) => total + order.total, 0);
  const qrisCount = paid.filter((order) => order.payment === 'qris').length;
  const cashCount = paid.filter((order) => order.payment === 'cash').length;

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
    anchor.download = `transaksi-ngoffe-${range}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StaffShell
      title="Transaksi Harian"
      subtitle="Rekap pembayaran dan riwayat pesanan untuk kebutuhan laporan kasir."
      actions={
        <IonButton fill="outline" size="small" onClick={exportCsv}>
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
            <IonIcon icon={receiptOutline} />
          </div>
          <div className="kpi-label">Transaksi</div>
          <div className="kpi-value">{visible.length}</div>
          <div className="kpi-note">Termasuk yang belum dibayar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={walletOutline} />
          </div>
          <div className="kpi-label">Pendapatan</div>
          <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
            {rupiah(revenue)}
          </div>
          <div className="kpi-note">Pesanan tervalidasi</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={qrCodeOutline} />
          </div>
          <div className="kpi-label">QRIS</div>
          <div className="kpi-value">{qrisCount}</div>
          <div className="kpi-note">Transfer / e-wallet</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={cashOutline} />
          </div>
          <div className="kpi-label">Cash</div>
          <div className="kpi-value">{cashCount}</div>
          <div className="kpi-note">Dibayar di kamar</div>
        </div>
      </div>

      <div className="panel">
        <div className="row-between wrap" style={{ marginBottom: 6 }}>
          <div>
            <h3 className="panel-title">Daftar transaksi</h3>
            <p className="panel-sub">
              {range === 'today'
                ? `${visible.length} transaksi hari ini`
                : `${visible.length} transaksi pada rentang ini`}
            </p>
          </div>
          <span className="badge-soft">
            {range === 'today' ? 'Hari ini' : range === 'week' ? '7 hari terakhir' : 'Semua data'}
          </span>
        </div>

        {visible.length ? (
          visible.map((order) => (
            <div
              className="manage-row"
              key={order.id}
              onClick={() => router.push(`/staff/kasir/order/${order.id}`)}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="manage-thumb"
                style={{
                  background: order.payment === 'qris' ? '#d9efe6' : '#e8f4ee',
                  color: '#1f5c45',
                }}
              >
                <IonIcon icon={order.payment === 'qris' ? qrCodeOutline : cashOutline} />
              </div>
              <div className="grow">
                <div className="row-between wrap">
                  <div>
                    <div className="order-code">{order.code}</div>
                    <div className="order-meta" style={{ marginTop: 2 }}>
                      <span>Kamar {order.room}</span>
                      <span>{order.guestName}</span>
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    <StatusBadge status={order.status} label={statusLabel[order.status]} />
                    <strong className="order-total">{rupiah(order.total)}</strong>
                    <IonIcon icon={arrowForwardOutline} color="medium" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            emoji="🗂️"
            title="Belum ada transaksi"
            text="Transaksi akan muncul setelah tamu memesan dan kasir memvalidasi."
          />
        )}
      </div>
    </StaffShell>
  );
};

export default KasirTransactions;
