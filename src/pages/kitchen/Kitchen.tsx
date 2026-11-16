import { IonButton, IonIcon, useIonToast } from '@ionic/react';
import {
  checkmarkCircleOutline,
  cubeOutline,
  eyeOutline,
  flameOutline,
  timeOutline,
  timerOutline,
  volumeHighOutline,
  volumeMuteOutline,
  warningOutline,
} from 'ionicons/icons';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EmptyState } from '../../components/EmptyState';
import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useApp } from '../../store/AppStore';
import type { Order } from '../../types';
import { formatQty, isToday, statusLabel, timeAgo } from '../../utils/format';
import { formatPrepClock, prepItemsFor, prepSeconds, prepStats } from '../../utils/kitchen';
import { successFeedback, tapFeedback } from '../../utils/native';
import { playOrderChime, unlockNotificationSound } from '../../utils/notify';

type Tab = 'antrean' | 'siap';

const SLA_WARN_MINUTES = 8;
const SLA_LATE_MINUTES = 15;

const startedProcessingAt = (order: Order): string =>
  order.timeline.find((entry) => entry.status === 'diproses')?.at ?? order.createdAt;

const elapsedMinutes = (iso: string, now: number): number =>
  Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

const Kitchen: React.FC = () => {
  const { state, setOrderStatus, adjustStock, startKitchenItem, finishKitchenItem, startAllKitchenItems } = useApp();
  const location = useLocation();
  const [present] = useIonToast();
  const [tab, setTab] = useState<Tab>('antrean');
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('ngoffe-sound') !== 'off';
    } catch {
      return true;
    }
  });
  const [keepAwake, setKeepAwake] = useState(() => {
    try {
      return localStorage.getItem('ngoffe-keep-awake') !== 'off';
    } catch {
      return true;
    }
  });
  const { supported: wakeSupported, active: wakeActive } = useWakeLock(keepAwake);
  const seenQueueRef = useRef<Set<string>>(new Set());
  const queueWatchReadyRef = useRef(false);

  useEffect(() => {
    // Timer masak perlu detak per detik; SLA tetap dihitung dalam menit.
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
    try {
      localStorage.setItem('ngoffe-keep-awake', keepAwake ? 'on' : 'off');
    } catch {
      // Preferensi layar tidak kritis bila storage diblokir.
    }
  }, [keepAwake]);

  // Dapur juga perlu mendengar pesanan baru yang baru divalidasi kasir.
  useEffect(() => {
    const incoming = state.orders.filter((order) => order.status === 'diproses');

    if (!queueWatchReadyRef.current) {
      incoming.forEach((order) => seenQueueRef.current.add(order.id));
      queueWatchReadyRef.current = true;
      return;
    }

    const fresh = incoming.filter((order) => !seenQueueRef.current.has(order.id));
    incoming.forEach((order) => seenQueueRef.current.add(order.id));
    if (!fresh.length) return;

    if (soundOn) playOrderChime();
    void present({
      message:
        fresh.length === 1
          ? `Pesanan ${fresh[0].code} masuk antrean dapur.`
          : `${fresh.length} pesanan baru masuk antrean dapur.`,
      duration: 2600,
      color: 'primary',
      position: 'top',
      buttons: [{ text: 'Lihat', handler: () => setTab('antrean') }],
    });
  }, [state.orders, present, soundOn]);

  const toggleSound = () => {
    setSoundOn((current) => {
      if (!current) {
        unlockNotificationSound();
        playOrderChime();
      }
      return !current;
    });
  };

  const toggleKeepAwake = () => {
    if (!keepAwake && !wakeSupported) {
      void present({
        message: 'Perangkat ini belum mendukung layar tetap menyala.',
        duration: 2200,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    void tapFeedback();
    setKeepAwake((current) => !current);
  };

  const queue = state.orders
    .filter((order) => order.status === 'diproses')
    .sort((a, b) => startedProcessingAt(a).localeCompare(startedProcessingAt(b)));
  const ready = state.orders
    .filter((order) => order.status === 'siap_diantar')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const lateCount = queue.filter((order) => elapsedMinutes(startedProcessingAt(order), now) >= SLA_LATE_MINUTES).length;
  const warnCount = queue.filter((order) => {
    const minutes = elapsedMinutes(startedProcessingAt(order), now);
    return minutes >= SLA_WARN_MINUTES && minutes < SLA_LATE_MINUTES;
  }).length;
  const doneToday = state.orders.filter((order) => order.status === 'selesai' && isToday(order.updatedAt)).length;
  const lowStock = state.stock.filter((item) => item.qty <= item.min);
  const stockSorted = [...state.stock].sort((a, b) => {
    const aLow = a.qty <= a.min ? 0 : 1;
    const bLow = b.qty <= b.min ? 0 : 1;
    return aLow - bLow || a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (location.hash === '#stok') {
      const element = document.getElementById('stok');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const visible = tab === 'antrean' ? queue : ready;

  return (
    <StaffShell
      title="Antrean Dapur"
      subtitle="Siapkan pesanan sesuai urutan masuk dan tandai saat siap diantar."
      actions={
        <>
          <IonButton
            fill={keepAwake ? 'solid' : 'outline'}
            color={keepAwake ? 'success' : 'medium'}
            size="small"
            onClick={toggleKeepAwake}
            aria-label={keepAwake ? 'Matikan layar tetap menyala' : 'Aktifkan layar tetap menyala'}
            aria-pressed={keepAwake}
          >
            <IonIcon slot="start" icon={eyeOutline} />
            {keepAwake && wakeSupported ? (wakeActive ? 'Layar Aktif' : 'Layar Menyala…') : 'Layar Normal'}
          </IonButton>
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
        </>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={flameOutline} />
          </div>
          <div className="kpi-label">Antrean Aktif</div>
          <div className="kpi-value">{queue.length}</div>
          <div className="kpi-note">Pesanan harus disiapkan</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={checkmarkCircleOutline} />
          </div>
          <div className="kpi-label">Siap Diantar</div>
          <div className="kpi-value">{ready.length}</div>
          <div className="kpi-note">Menunggu kurir / kasir</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={timeOutline} />
          </div>
          <div className="kpi-label">Selesai Hari Ini</div>
          <div className="kpi-value">{doneToday}</div>
          <div className="kpi-note">Pesanan tuntas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={warningOutline} />
          </div>
          <div className="kpi-label">Stok Menipis</div>
          <div className="kpi-value">{lowStock.length}</div>
          <div className="kpi-note">Bahan di bawah minimum</div>
        </div>
      </div>

      {keepAwake && wakeSupported && (
        <div className={`wake-banner ${wakeActive ? 'on' : 'pending'}`} role="status">
          <IonIcon icon={eyeOutline} />
          <span>
            {wakeActive
              ? 'Layar dapur dijaga tetap menyala selama antrean dipantau.'
              : 'Menunggu izin layar tetap menyala…'}
          </span>
        </div>
      )}

      <div className="segmented" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`segment-btn ${tab === 'antrean' ? 'active' : ''}`}
          onClick={() => setTab('antrean')}
        >
          Antrean<span className="count">{queue.length}</span>
        </button>
        <button
          type="button"
          className={`segment-btn ${tab === 'siap' ? 'active' : ''}`}
          onClick={() => setTab('siap')}
        >
          Siap Diantar<span className="count">{ready.length}</span>
        </button>
      </div>

      {tab === 'antrean' && (lateCount > 0 || warnCount > 0) && (
        <div className={`sla-banner ${lateCount > 0 ? 'late' : 'warn'}`} role="status">
          <IonIcon icon={timerOutline} />
          <span>
            {lateCount > 0
              ? `${lateCount} pesanan melewati SLA ${SLA_LATE_MINUTES} menit. Prioritaskan pesanan tertua.`
              : `${warnCount} pesanan mendekati batas SLA ${SLA_LATE_MINUTES} menit.`}
          </span>
        </div>
      )}

      {visible.length ? (
        <div className="grid-auto" style={{ alignItems: 'start' }}>
          {visible.map((order) => {
            const minutes = elapsedMinutes(startedProcessingAt(order), now);
            const slaState =
              order.status !== 'diproses'
                ? 'idle'
                : minutes >= SLA_LATE_MINUTES
                  ? 'late'
                  : minutes >= SLA_WARN_MINUTES
                    ? 'warn'
                    : 'ok';
            const prep = prepItemsFor(order);
            const stats = prepStats(order);
            const processing = order.status === 'diproses';
            return (
              <div className={`panel kitchen-ticket sla-${slaState}`} key={order.id}>
                <div className="row-between wrap">
                  <div>
                    <div className="order-code">{order.code}</div>
                    <div className="order-meta" style={{ marginTop: 4 }}>
                      <span>🛏️ Kamar {order.room}</span>
                      <span>• {timeAgo(order.createdAt)}</span>
                      {processing && (
                        <span className={`sla-chip ${slaState}`}>
                          <IonIcon icon={timerOutline} />
                          {minutes} mnt
                          {slaState === 'late' ? ' • lewat SLA' : slaState === 'warn' ? ' • segera' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={order.status} label={statusLabel[order.status]} />
                </div>

                <div className="divider" />

                {order.items.map((item) => {
                  const itemPrep = prep.find((entry) => entry.menuId === item.menuId);
                  const done = Boolean(itemPrep?.finishedAt);
                  const running = Boolean(itemPrep?.startedAt) && !done;
                  const seconds = prepSeconds(itemPrep, now);
                  return (
                    <div
                      className={`kitchen-item ${done ? 'done' : running ? 'running' : 'idle'}`}
                      key={`${item.menuId}-${item.name}`}
                    >
                      <div className="grow">
                        <strong>
                          <span className="badge-soft" style={{ marginRight: 6 }}>
                            {item.qty}×
                          </span>
                          {item.name}
                        </strong>
                        {item.note && <div className="item-note">📝 {item.note}</div>}
                        {itemPrep?.startedAt && (
                          <div className="prep-timer">
                            <IonIcon icon={done ? checkmarkCircleOutline : timerOutline} />
                            <strong>{formatPrepClock(seconds)}</strong>
                            <span className="muted small">{done ? 'total masak' : 'berjalan'}</span>
                          </div>
                        )}
                      </div>
                      {processing && (
                        <div className="prep-actions">
                          {!itemPrep?.startedAt && (
                            <IonButton
                              size="small"
                              fill="outline"
                              onClick={() => {
                                void tapFeedback();
                                startKitchenItem(order.id, item.menuId);
                              }}
                            >
                              Mulai masak
                            </IonButton>
                          )}
                          {running && (
                            <IonButton
                              size="small"
                              color="success"
                              onClick={() => {
                                void successFeedback();
                                finishKitchenItem(order.id, item.menuId);
                              }}
                            >
                              Selesai
                            </IonButton>
                          )}
                          {done && <span className="badge-soft success">Selesai</span>}
                        </div>
                      )}
                      {!processing && done && <span className="badge-soft success">Selesai</span>}
                    </div>
                  );
                })}

                <div className="prep-summary">
                  <span className="muted small">
                    {stats.finished}/{stats.total} item selesai
                    {processing && stats.remaining > 0 ? ` • ${stats.remaining} tersisa` : ''}
                  </span>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {processing && stats.started < stats.total && (
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => {
                          void tapFeedback();
                          startAllKitchenItems(order.id);
                        }}
                      >
                        Mulai semua
                      </IonButton>
                    )}
                    {processing ? (
                      <IonButton
                        size="small"
                        color="success"
                        disabled={!stats.allFinished}
                        onClick={() => {
                          void successFeedback();
                          setOrderStatus(
                            order.id,
                            'siap_diantar',
                            'Kitchen',
                            'Pesanan selesai disiapkan, siap diantar',
                          );
                        }}
                      >
                        <IonIcon slot="start" icon={checkmarkCircleOutline} />
                        Tandai Siap
                      </IonButton>
                    ) : (
                      <span className="badge-soft success">Menunggu diantar</span>
                    )}
                  </div>
                </div>
                {processing && !stats.allFinished && (
                  <p className="muted small" style={{ margin: '8px 0 0' }}>
                    Tombol siap aktif setelah semua item ditandai selesai.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            emoji={tab === 'antrean' ? '🍳' : '🛎️'}
            title={tab === 'antrean' ? 'Tidak ada antrean' : 'Belum ada pesanan siap'}
            text={
              tab === 'antrean'
                ? 'Pesanan yang divalidasi kasir akan muncul di sini.'
                : 'Tandai pesanan siap diantar agar muncul di daftar ini.'
            }
          />
        </div>
      )}

      <div id="stok" style={{ marginTop: 24 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <div>
            <span className="section-kicker">Bahan baku</span>
            <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
              Stok Dapur
            </h2>
          </div>
          <span className={`badge-soft ${lowStock.length ? 'danger' : 'success'}`}>
            {lowStock.length} bahan menipis
          </span>
        </div>

        <div className="panel">
          {stockSorted.map((item) => {
            const ratio = Math.min(100, Math.round((item.qty / Math.max(item.min * 2, 1)) * 100));
            const low = item.qty <= item.min;
            return (
              <div className="stock-row" key={item.id}>
                <div className="grow">
                  <div className="row-between">
                    <strong className="small">
                      {item.name}
                      {low && (
                        <span className="badge-soft danger" style={{ marginLeft: 8 }}>
                          Menipis
                        </span>
                      )}
                    </strong>
                    <span className="muted small">
                      {formatQty(item.qty)} {item.unit} / min {formatQty(item.min)}
                    </span>
                  </div>
                  <div className="stock-bar">
                    <div className={`stock-fill ${low ? 'low' : ''}`} style={{ width: `${Math.max(4, ratio)}%` }} />
                  </div>
                </div>
                <div className="mini-stepper">
                  <button
                    type="button"
                    onClick={() => {
                      void tapFeedback();
                      adjustStock(item.id, -1);
                    }}
                    aria-label="Kurangi stok"
                  >
                    −
                  </button>
                  <IonIcon icon={cubeOutline} color="medium" />
                  <button
                    type="button"
                    onClick={() => {
                      void tapFeedback();
                      adjustStock(item.id, 1);
                    }}
                    aria-label="Tambah stok"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StaffShell>
  );
};

export default Kitchen;
