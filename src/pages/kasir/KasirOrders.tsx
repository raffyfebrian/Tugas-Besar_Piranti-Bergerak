import { IonButton, IonIcon, useIonRouter, useIonToast } from '@ionic/react';
import {
  cashOutline,
  checkmarkDoneOutline,
  flameOutline,
  receiptOutline,
  statsChartOutline,
  timeOutline,
  volumeHighOutline,
  volumeMuteOutline,
  walletOutline,
} from 'ionicons/icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { CountUp } from '../../components/CountUp';
import { EmptyState } from '../../components/EmptyState';
import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import type { Order } from '../../types';
import { formatTime, isToday, orderItemCount, paymentLabel, rupiah, statusLabel, timeAgo } from '../../utils/format';
import { playOrderChime, unlockNotificationSound } from '../../utils/notify';

type FilterKey = 'semua' | 'validasi' | 'diproses' | 'siap' | 'selesai';

const FILTERS: { key: FilterKey; label: string; match: (order: Order) => boolean }[] = [
  { key: 'semua', label: 'Semua', match: () => true },
  { key: 'validasi', label: 'Perlu Validasi', match: (order) => order.status === 'menunggu_validasi' },
  { key: 'diproses', label: 'Diproses', match: (order) => order.status === 'diproses' },
  { key: 'siap', label: 'Siap Antar', match: (order) => order.status === 'siap_diantar' },
  { key: 'selesai', label: 'Selesai', match: (order) => order.status === 'selesai' },
];

const KasirOrders: React.FC = () => {
  const { state } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [filter, setFilter] = useState<FilterKey>('semua');
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('ngoffe-sound') !== 'off';
    } catch {
      return true;
    }
  });
  const seenValidationRef = useRef<Set<string>>(new Set());
  const validationWatchReadyRef = useRef(false);

  const orders = useMemo(
    () => [...state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.orders],
  );

  useEffect(() => {
    const unlock = () => {
      if (soundOn) unlockNotificationSound();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [soundOn]);

  useEffect(() => {
    try {
      localStorage.setItem('ngoffe-sound', soundOn ? 'on' : 'off');
    } catch {
      // Preferensi suara tidak kritis bila storage diblokir.
    }
  }, [soundOn]);

  useEffect(() => {
    const waiting = orders.filter((order) => order.status === 'menunggu_validasi');

    if (!validationWatchReadyRef.current) {
      waiting.forEach((order) => seenValidationRef.current.add(order.id));
      validationWatchReadyRef.current = true;
      return;
    }

    const fresh = waiting.filter((order) => !seenValidationRef.current.has(order.id));
    waiting.forEach((order) => seenValidationRef.current.add(order.id));
    if (!fresh.length) return;

    if (soundOn) playOrderChime();
    void present({
      message:
        fresh.length === 1
          ? `Pesanan ${fresh[0].code} menunggu validasi pembayaran.`
          : `${fresh.length} pesanan baru menunggu validasi pembayaran.`,
      duration: 2800,
      color: 'success',
      position: 'top',
      buttons: [{ text: 'Lihat', handler: () => setFilter('validasi') }],
    });
  }, [orders, present, soundOn]);

  const toggleSound = () => {
    setSoundOn((current) => {
      if (!current) {
        unlockNotificationSound();
        playOrderChime();
      }
      return !current;
    });
  };

  const todayOrders = orders.filter((order) => isToday(order.createdAt));
  const revenue = todayOrders
    .filter((order) => order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran')
    .reduce((total, order) => total + order.total, 0);
  const needValidation = orders.filter(
    (order) => order.status === 'menunggu_validasi' || order.status === 'menunggu_pembayaran',
  ).length;
  const processing = orders.filter((order) => order.status === 'diproses').length;
  const ready = orders.filter((order) => order.status === 'siap_diantar').length;

  const activeFilter = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];
  const visible = orders.filter(activeFilter.match);

  return (
    <StaffShell
      title="Pesanan Masuk"
      subtitle="Validasi pembayaran, pantau antrean, dan antar pesanan ke kamar."
      actions={
        <>
          <IonButton
            fill="outline"
            size="small"
            onClick={toggleSound}
            aria-label={soundOn ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
            aria-pressed={soundOn}
          >
            <IonIcon slot="start" icon={soundOn ? volumeHighOutline : volumeMuteOutline} />
            {soundOn ? 'Suara Aktif' : 'Suara Mati'}
          </IonButton>
          <IonButton fill="outline" size="small" routerLink="/staff/kasir/transactions">
            <IonIcon slot="start" icon={statsChartOutline} />
            Transaksi
          </IonButton>
          <IonButton size="small" routerLink="/staff/kasir?refresh=1" onClick={() => undefined}>
            <IonIcon slot="start" icon={receiptOutline} />
            Pesanan
          </IonButton>
        </>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={timeOutline} />
            {needValidation > 0 && <span className="kpi-live-dot" aria-hidden="true" />}
          </div>
          <div className="kpi-label">Perlu Validasi</div>
          <div className="kpi-value">
            <CountUp value={needValidation} />
          </div>
          <div className="kpi-note">QRIS / cash menunggu kasir</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={flameOutline} />
          </div>
          <div className="kpi-label">Diproses</div>
          <div className="kpi-value">
            <CountUp value={processing} />
          </div>
          <div className="kpi-note">Sedang disiapkan dapur</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={checkmarkDoneOutline} />
          </div>
          <div className="kpi-label">Siap Antar</div>
          <div className="kpi-value">
            <CountUp value={ready} />
          </div>
          <div className="kpi-note">Menunggu diantar ke kamar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={walletOutline} />
          </div>
          <div className="kpi-label">Pendapatan Hari Ini</div>
          <div className="kpi-value" style={{ fontSize: '1.15rem' }}>
            <CountUp value={revenue} format={rupiah} />
          </div>
          <div className="kpi-note">{todayOrders.length} pesanan hari ini</div>
        </div>
      </div>

      <div className="segmented" style={{ marginBottom: 14 }}>
        {FILTERS.map((item) => {
          const count = orders.filter(item.match).length;
          return (
            <button
              key={item.key}
              type="button"
              className={`segment-btn ${filter === item.key ? 'active' : ''}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
              <span className="count">{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length ? (
        <div className="stack">
          {visible.map((order, index) => (
            <div
              className="order-card fade-up"
              data-status={order.status}
              key={order.id}
              onClick={() => router.push(`/staff/kasir/order/${order.id}`)}
              role="button"
              tabIndex={0}
              style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
            >
              <div className="row-between wrap">
                <div>
                  <div className="order-code">{order.code}</div>
                  <div className="order-meta" style={{ marginTop: 4 }}>
                    <span>🛏️ Kamar {order.room}</span>
                    <span>{order.guestName}</span>
                    <span>• {timeAgo(order.createdAt)}</span>
                  </div>
                </div>
                <StatusBadge status={order.status} label={statusLabel[order.status]} />
              </div>

              <div className="row-between wrap" style={{ marginTop: 10 }}>
                <div className="order-meta">
                  <span className={`badge-soft ${order.payment === 'cash' ? 'warning' : ''}`}>
                    <IonIcon icon={order.payment === 'cash' ? cashOutline : receiptOutline} />
                    {paymentLabel[order.payment]}
                  </span>
                  <span>{orderItemCount(order)} item</span>
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                <span className="order-total">{rupiah(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            emoji="🧾"
            title="Belum ada pesanan di filter ini"
            text="Pesanan baru dari tamu akan muncul otomatis di sini."
          />
        </div>
      )}
    </StaffShell>
  );
};

export default KasirOrders;
