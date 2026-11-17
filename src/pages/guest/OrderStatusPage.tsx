import { IonButton, IonIcon, IonTextarea, useIonRouter, useIonToast } from '@ionic/react';
import {
  checkmarkCircleOutline,
  checkmarkOutline,
  homeOutline,
  notificationsOffOutline,
  notificationsOutline,
  printOutline,
  repeatOutline,
  searchOutline,
  timeOutline,
  timerOutline,
} from 'ionicons/icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Confetti } from '../../components/Confetti';
import { GuestShell } from '../../components/GuestShell';
import { StarRating } from '../../components/StarRating';
import { StatusBadge } from '../../components/StatusBadge';
import { useOrderStatusNotice } from '../../hooks/useOrderStatusNotice';
import { useApp } from '../../store/AppStore';
import type { Order, OrderStatus } from '../../types';
import { estimateOrderEta } from '../../utils/eta';
import { formatDateTime, formatTime, orderItemCount, paymentLabel, rupiah, statusLabel } from '../../utils/format';
import { successFeedback } from '../../utils/native';
import { playOrderChime } from '../../utils/notify';
import {
  isNotificationEnabled,
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  setNotificationEnabled,
} from '../../utils/statusNotify';
import type { NotificationPermissionState } from '../../utils/statusNotify';

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

const RATING_HINTS: Record<number, string> = {
  1: 'Kurang',
  2: 'Cukup',
  3: 'Baik',
  4: 'Sangat baik',
  5: 'Luar biasa',
};

const GuestOrderStatus: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { state, reorder, submitFeedback } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [notifyState, setNotifyState] = useState<NotificationPermissionState>('prompt');
  const [notifyEnabled, setNotifyEnabledState] = useState(() => isNotificationEnabled());

  const order: Order | undefined = id
    ? state.orders.find((item) => item.id === id || item.code.toLowerCase() === id.toLowerCase())
    : undefined;

  const trackedId = order?.id ?? '';
  const trackedStatus = order?.status;

  useEffect(() => {
    void notificationPermission().then(setNotifyState);
  }, []);

  // Konfeti hanya sebentar, lalu dilepas dari DOM agar tidak menumpuk.
  useEffect(() => {
    if (!celebrate) return undefined;
    const timer = window.setTimeout(() => setCelebrate(false), 2600);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  // Segarkan estimasi tiap 30 detik agar sisa menit ikut berjalan.
  useEffect(() => {
    if (!trackedId || trackedStatus === 'selesai' || trackedStatus === 'dibatalkan') return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [trackedId, trackedStatus]);

  const handleStatusChange = useCallback(
    (next: Order) => {
      playOrderChime();
      void present({
        message: `Status pesanan diperbarui: ${statusLabel[next.status]}`,
        duration: 2600,
        color: next.status === 'dibatalkan' ? 'danger' : 'success',
        position: 'top',
      });
    },
    [present],
  );

  useOrderStatusNotice(order, handleStatusChange);

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotifyState(permission);
    if (permission === 'granted') {
      setNotificationEnabled(true);
      setNotifyEnabledState(true);
      void present({
        message: 'Notifikasi status diaktifkan.',
        duration: 1800,
        color: 'success',
        position: 'top',
      });
      return;
    }
    if (permission === 'denied') {
      void present({
        message: 'Izin notifikasi diblokir. Aktifkan lewat pengaturan perangkat.',
        duration: 2600,
        color: 'warning',
        position: 'top',
      });
    }
  };

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

  // Tambahkan ulang item pesanan lama; menu yang sudah habis otomatis dilewati.
  const handleReorder = (target: Order) => {
    const count = reorder(target.id);
    if (!count) {
      void present({
        message: 'Menu pada pesanan ini sedang tidak tersedia.',
        duration: 2400,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    void successFeedback();
    void present({
      message: `${count} item ditambahkan ke keranjang.`,
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    router.push('/order/cart');
  };

  const sendFeedback = () => {
    if (!order || !rating) return;
    submitFeedback(order.id, rating, comment);
    setCelebrate(true);
    void successFeedback();
    void present({
      message: 'Terima kasih! Ulasan Anda membantu kami.',
      duration: 2400,
      color: 'success',
      position: 'top',
    });
  };

  if (!order) {
    const roomOrders = state.orders
      .filter((item) => state.room && item.room === state.room)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);

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
            <div className="row-between wrap">
              <div>
                <h3 className="panel-title">Riwayat kamar {state.room}</h3>
                <p className="panel-sub">Ketuk pesanan untuk melihat status atau memesan ulang.</p>
              </div>
              <span className="badge-soft">{roomOrders.length} pesanan</span>
            </div>

            <div className="history-list">
              {roomOrders.map((item, index) => (
                <article
                  key={item.id}
                  className="history-card fade-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                >
                  <div className="history-head">
                    <div>
                      <div className="order-code">{item.code}</div>
                      <div className="order-meta">
                        <span>{formatDateTime(item.createdAt)}</span>
                        <span>{orderItemCount(item)} item</span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} label={statusLabel[item.status]} />
                  </div>

                  <div className="history-items">
                    {item.items.map((line) => (
                      <span className="history-chip" key={`${item.id}-${line.menuId}`}>
                        {line.qty}× {line.name}
                      </span>
                    ))}
                  </div>

                  {item.feedback && (
                    <div className="history-rating">
                      <StarRating value={item.feedback.rating} size="sm" />
                      <span className="muted small">Ulasan Anda</span>
                    </div>
                  )}

                  <div className="history-foot">
                    <strong>{rupiah(item.total)}</strong>
                    <div className="history-actions">
                      <IonButton size="small" fill="outline" onClick={() => router.push(`/order/status/${item.id}`)}>
                        Lihat status
                      </IonButton>
                      <IonButton size="small" onClick={() => handleReorder(item)}>
                        <IonIcon slot="start" icon={repeatOutline} />
                        Pesan lagi
                      </IonButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {state.room && !roomOrders.length && (
          <div className="panel center" style={{ marginTop: 14 }}>
            <div style={{ fontSize: '2rem' }}>🛏️</div>
            <h3 className="panel-title">Belum ada pesanan di kamar {state.room}</h3>
            <p className="muted small">Mulai pesan menu favorit Anda, riwayatnya akan muncul di sini.</p>
            <IonButton routerLink="/order/menu" style={{ marginTop: 10 }}>
              Lihat Menu
            </IonButton>
          </div>
        )}
      </GuestShell>
    );
  }

  const cancelled = order.status === 'dibatalkan';
  const completed = order.status === 'selesai';
  const canPay = order.status === 'menunggu_pembayaran';
  const active = !cancelled && !completed;
  const eta = estimateOrderEta(order, state.orders, now);
  const flowIndex = FLOW.indexOf(order.status);
  const progressPercent = cancelled
    ? 0
    : completed
      ? 100
      : Math.max(6, Math.round((flowIndex / (FLOW.length - 1)) * 100));
  const showNotifyPrompt = active && notificationsSupported() && !notifyEnabled;

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
          {order.cancelReason ? (
            <>
              Alasan: {order.cancelReason}
              {order.refundAmount ? (
                <>
                  {' '}
                  • Refund {rupiah(order.refundAmount)}
                  {order.refundMethod && order.refundMethod !== 'none'
                    ? ` via ${order.refundMethod.toUpperCase()}`
                    : ''}{' '}
                  akan diproses kasir.
                </>
              ) : null}
            </>
          ) : (
            statusHint[order.status]
          )}
        </div>
      </div>

      {eta && active && (
        <div className="panel eta-panel" style={{ marginBottom: 14 }} aria-live="polite">
          <span className="eta-icon" aria-hidden="true">
            <IonIcon icon={timerOutline} />
          </span>
          <div className="eta-copy">
            <span className="section-kicker">Estimasi tiba di kamar</span>
            <strong className="eta-minutes">±{eta.minutes} menit</strong>
            <span className="eta-clock">
              Sekitar {formatTime(eta.readyAt.toISOString())} • Kamar {order.room}
            </span>
          </div>
          <span className="eta-pulse" aria-hidden="true" />
        </div>
      )}

      {showNotifyPrompt && (
        <div className="panel notify-panel" style={{ marginBottom: 14 }}>
          <span className="notify-icon" aria-hidden="true">
            <IonIcon icon={notifyState === 'denied' ? notificationsOffOutline : notificationsOutline} />
          </span>
          <div className="notify-copy">
            <strong>Notifikasi status pesanan</strong>
            <p>
              {notifyState === 'denied'
                ? 'Izin notifikasi diblokir. Aktifkan lewat pengaturan browser atau perangkat.'
                : 'Aktifkan agar Anda tahu saat pesanan siap diantar, tanpa perlu terus membuka halaman ini.'}
            </p>
          </div>
          {notifyState !== 'denied' && (
            <IonButton size="small" fill="outline" onClick={enableNotifications}>
              Aktifkan
            </IonButton>
          )}
        </div>
      )}

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3 className="panel-title">Progres pesanan</h3>

        <div className="flow-progress">
          <div className="flow-progress-head">
            <span>{cancelled ? 'Pesanan dibatalkan' : `Tahap ${Math.max(1, flowIndex + 1)} dari ${FLOW.length}`}</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div
            className={`progress-track${completed ? ' is-complete' : ''}${cancelled ? ' is-cancelled' : ''}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Progres pesanan"
          >
            <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

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
        <IonButton size="small" fill="clear" routerLink="/order/status" style={{ marginTop: 6, marginLeft: -8 }}>
          <IonIcon slot="start" icon={timeOutline} />
          Semua pesanan kamar {order.room}
        </IonButton>
      </div>

      {completed && (
        <div className="panel feedback-panel" style={{ marginBottom: 14 }}>
          {order.feedback ? (
            <div className="feedback-thanks">
              <span className="feedback-emoji" aria-hidden="true">
                🎉
              </span>
              <div>
                <h3 className="panel-title mb-0">Terima kasih atas ulasannya!</h3>
                <div className="feedback-saved">
                  <StarRating value={order.feedback.rating} size="sm" showValue />
                  <span className="muted small">{formatDateTime(order.feedback.at)}</span>
                </div>
                {order.feedback.comment && <p className="feedback-quote">“{order.feedback.comment}”</p>}
              </div>
            </div>
          ) : (
            <>
              <div className="row-between wrap">
                <div>
                  <h3 className="panel-title mb-0">Bagaimana pesanan Anda?</h3>
                  <p className="panel-sub">Rating Anda membantu dapur dan kasir kami.</p>
                </div>
                <span className="badge-soft success">Selesai</span>
              </div>

              <div className="feedback-stars">
                <StarRating value={rating} onChange={setRating} size="lg" label="Beri rating pesanan" />
                <span className={`feedback-hint${rating ? ' active' : ''}`}>
                  {rating ? RATING_HINTS[rating] : 'Pilih bintang'}
                </span>
              </div>

              <IonTextarea
                className="feedback-comment"
                placeholder="Ceritakan rasa atau pelayanan (opsional)…"
                value={comment}
                onIonInput={(event) => setComment(event.detail.value ?? '')}
                autoGrow
                rows={2}
                maxlength={180}
                counter
              />

              <IonButton expand="block" style={{ marginTop: 12 }} disabled={!rating} onClick={sendFeedback}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                Kirim Ulasan
              </IonButton>
            </>
          )}
        </div>
      )}

      <div className="stack">
        {canPay && (
          <IonButton expand="block" size="large" routerLink={`/order/payment/${order.id}`}>
            Lanjutkan Pembayaran
          </IonButton>
        )}
        <IonButton expand="block" fill={canPay ? 'outline' : 'solid'} onClick={() => handleReorder(order)}>
          <IonIcon slot="start" icon={repeatOutline} />
          Pesan Lagi
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/">
          <IonIcon slot="start" icon={homeOutline} />
          Kembali ke Beranda
        </IonButton>
      </div>

      {celebrate && <Confetti />}

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
