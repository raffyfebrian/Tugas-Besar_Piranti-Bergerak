import { IonButton, IonIcon, useIonRouter, useIonToast } from '@ionic/react';
import {
  arrowForwardOutline,
  checkmarkOutline,
  homeOutline,
  printOutline,
  receiptOutline,
  searchOutline,
} from 'ionicons/icons';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { GuestShell } from '../../components/GuestShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import type { Order, OrderStatus } from '../../types';
import { formatDateTime, paymentLabel, rupiah, statusLabel } from '../../utils/format';

const FLOW: OrderStatus[] = [
  'menunggu_pembayaran',
  'menunggu_validasi',
  'diproses',
  'siap_diantar',
  'diantar',
  'selesai',
];

const statusHint: Record<OrderStatus, string> = {
  menunggu_pembayaran: 'Selesaikan pembayaran agar pesanan diteruskan ke kasir.',
  menunggu_validasi: 'Kasir sedang memeriksa pembayaran Anda.',
  diproses: 'Pesanan sedang disiapkan oleh tim dapur.',
  siap_diantar: 'Pesanan siap dan segera diantar ke kamar.',
  diantar: 'Pesanan sedang dalam perjalanan ke kamar Anda.',
  selesai: 'Pesanan sudah diterima. Selamat menikmati!',
  dibatalkan: 'Pesanan dibatalkan. Silakan hubungi kasir bila perlu bantuan.',
};

const GuestOrderStatus: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { state, clearCart } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [query, setQuery] = useState('');

  const order: Order | undefined = id
    ? state.orders.find((item) => item.id === id || item.code.toLowerCase() === id.toLowerCase())
    : undefined;

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const found = state.orders.find(
      (item) => item.code.toLowerCase() === query.trim().toLowerCase() || item.id === query.trim(),
    );
    if (found) {
      router.push(`/order/status/${found.id}`);
    } else {
      void present({
        message: 'Kode pesanan tidak ditemukan.',
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
    }
  };

  if (!order) {
    const roomOrders = state.orders
      .filter((item) => state.room && item.room === state.room)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);

    return (
      <GuestShell title="Lacak Pesanan" backHref="/order" showCart={false}>
        <div className="panel">
          <div className="center" style={{ fontSize: '2.4rem', marginBottom: 6 }}>
            🧾
          </div>
          <h1 className="section-title center" style={{ fontSize: '1.6rem' }}>
            Lacak pesanan Anda
          </h1>
          <p className="muted small center">
            Masukkan kode pesanan yang tertera saat konfirmasi, misalnya NGF-20261010-0001.
          </p>
          <form className="row" style={{ marginTop: 16, gap: 8 }} onSubmit={search}>
            <div className="search-shell grow">
              <IonIcon icon={searchOutline} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="NGF-YYYYMMDD-0001"
                aria-label="Kode pesanan"
              />
            </div>
            <IonButton type="submit" style={{ margin: 0 }}>
              Cari
            </IonButton>
          </form>
        </div>

        {roomOrders.length > 0 && (
          <div className="panel" style={{ marginTop: 14 }}>
            <h3 className="panel-title">Pesanan terakhir di kamar {state.room}</h3>
            {roomOrders.map((item) => (
              <div
                key={item.id}
                className="row-between"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--ngoffe-line)', cursor: 'pointer' }}
                onClick={() => router.push(`/order/status/${item.id}`)}
              >
                <div>
                  <div className="order-code">{item.code}</div>
                  <div className="order-meta">{formatDateTime(item.createdAt)}</div>
                </div>
                <div className="row">
                  <StatusBadge status={item.status} label={statusLabel[item.status]} />
                  <IonIcon icon={arrowForwardOutline} color="medium" />
                </div>
              </div>
            ))}
          </div>
        )}
      </GuestShell>
    );
  }

  const cancelled = order.status === 'dibatalkan';
  const completed = order.status === 'selesai';
  const canPay = order.status === 'menunggu_pembayaran';

  return (
    <GuestShell title="Status Pesanan" backHref="/order/menu" showCart={!completed}>
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="row-between wrap">
          <div>
            <span className="section-kicker">Nomor pesanan</span>
            <div className="order-code" style={{ fontSize: '1.05rem' }}>
              {order.code}
            </div>
            <div className="order-meta" style={{ marginTop: 4 }}>
              <span>🛏️ Kamar {order.room}</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
          </div>
          <StatusBadge status={order.status} label={statusLabel[order.status]} />
        </div>

        <div
          className="status-callout"
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 14,
            background: cancelled ? '#f8e3df' : '#eaf3ed',
            fontSize: '.82rem',
            lineHeight: 1.55,
          }}
        >
          {order.cancelReason ? `Alasan: ${order.cancelReason}` : statusHint[order.status]}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 className="panel-title">Progres pesanan</h3>
        <div className="timeline" style={{ marginTop: 14 }} key={order.status} aria-live="polite">
          {(cancelled
            ? order.timeline
            : FLOW.map((status) => ({
                status,
                at: order.timeline.find((entry) => entry.status === status)?.at,
                by: order.timeline.find((entry) => entry.status === status)?.by,
                note: order.timeline.find((entry) => entry.status === status)?.note,
              }))
          ).map((entry, index) => {
            const done = Boolean(entry.at) && entry.status !== order.status;
            const current = entry.status === order.status;
            return (
              <div
                key={`${entry.status}-${index}`}
                className={`timeline-item timeline-in ${done ? 'done' : ''} ${current ? 'current' : ''}`}
                style={{ animationDelay: `${index * 65}ms` }}
              >
                <div className="timeline-dot">
                  {done ? <IonIcon icon={checkmarkOutline} /> : current ? '•' : index + 1}
                </div>
                <div className="timeline-body">
                  <strong style={{ color: entry.at || current ? undefined : 'var(--ngoffe-muted)' }}>
                    {statusLabel[entry.status]}
                  </strong>
                  <span>
                    {entry.at ? formatDateTime(entry.at) : 'Menunggu'}
                    {entry.by ? ` • ${entry.by}` : ''}
                  </span>
                  {entry.note && <p>{entry.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 className="panel-title">Detail pesanan</h3>
        {order.items.map((item) => (
          <div className="item-line" key={`${item.menuId}-${item.name}`}>
            <div>
              <strong>{item.name}</strong>
              {item.note && <div className="item-note">“{item.note}”</div>}
            </div>
            <span className="muted small">
              {item.qty} × {rupiah(item.price)}
            </span>
          </div>
        ))}
        <div className="summary-row">
          <span>Pembayaran</span>
          <span>
            {paymentLabel[order.payment]}
            {order.proofName ? ' • bukti terunggah' : ''}
          </span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>{rupiah(order.total)}</span>
        </div>
      </div>

      <div className="stack">
        {canPay && (
          <IonButton expand="block" size="large" routerLink={`/order/payment/${order.id}`}>
            Lanjutkan Pembayaran
          </IonButton>
        )}
        <IonButton
          expand="block"
          fill={canPay ? 'outline' : 'solid'}
          routerLink="/order/menu"
          onClick={() => clearCart()}
        >
          <IonIcon slot="start" icon={receiptOutline} />
          Pesan Lagi
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/">
          <IonIcon slot="start" icon={homeOutline} />
          Kembali ke Beranda
        </IonButton>
      </div>

      {order.status !== 'selesai' && order.status !== 'dibatalkan' && (
        <div className="panel" style={{ marginTop: 14, background: '#eaf3ed', borderStyle: 'dashed' }}>
          <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <IonIcon icon={printOutline} color="primary" style={{ fontSize: 18, marginTop: 2 }} />
            <div>
              <strong className="small">Demo alur staf</strong>
              <p className="muted small" style={{ margin: '4px 0 8px', lineHeight: 1.55 }}>
                Buka dashboard kasir untuk memvalidasi pembayaran, lalu dapur untuk memproses pesanan. Status di halaman
                ini akan ikut berubah.
              </p>
              <IonButton size="small" fill="outline" routerLink="/staff">
                Buka Dashboard Staf
              </IonButton>
            </div>
          </div>
        </div>
      )}
    </GuestShell>
  );
};

export default GuestOrderStatus;
