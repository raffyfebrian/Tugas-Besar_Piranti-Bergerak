import { IonButton, IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  cubeOutline,
  flameOutline,
  timeOutline,
  timerOutline,
  warningOutline,
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { EmptyState } from '../../components/EmptyState';
import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import type { Order } from '../../types';
import { isToday, statusLabel, timeAgo } from '../../utils/format';

type Tab = 'antrean' | 'siap';

const SLA_WARN_MINUTES = 8;
const SLA_LATE_MINUTES = 15;

const startedProcessingAt = (order: Order): string =>
  order.timeline.find((entry) => entry.status === 'diproses')?.at ?? order.createdAt;

const elapsedMinutes = (iso: string, now: number): number =>
  Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));

const Kitchen: React.FC = () => {
  const { state, setOrderStatus, adjustStock } = useApp();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('antrean');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

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
    <StaffShell title="Antrean Dapur" subtitle="Siapkan pesanan sesuai urutan masuk dan tandai saat siap diantar.">
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
            return (
              <div className={`panel kitchen-ticket sla-${slaState}`} key={order.id}>
                <div className="row-between wrap">
                  <div>
                    <div className="order-code">{order.code}</div>
                    <div className="order-meta" style={{ marginTop: 4 }}>
                      <span>🛏️ Kamar {order.room}</span>
                      <span>• {timeAgo(order.createdAt)}</span>
                      {order.status === 'diproses' && (
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

                {order.items.map((item) => (
                  <div className="item-line" key={`${item.menuId}-${item.name}`}>
                    <div>
                      <strong>
                        <span className="badge-soft" style={{ marginRight: 6 }}>
                          {item.qty}×
                        </span>
                        {item.name}
                      </strong>
                      {item.note && <div className="item-note">📝 {item.note}</div>}
                    </div>
                  </div>
                ))}

                <div className="row-between" style={{ marginTop: 12 }}>
                  <span className="muted small">{order.guestName}</span>
                  {order.status === 'diproses' ? (
                    <IonButton
                      size="small"
                      color="success"
                      onClick={() =>
                        setOrderStatus(order.id, 'siap_diantar', 'Kitchen', 'Pesanan selesai disiapkan, siap diantar')
                      }
                    >
                      <IonIcon slot="start" icon={checkmarkCircleOutline} />
                      Tandai Siap
                    </IonButton>
                  ) : (
                    <span className="badge-soft success">Menunggu diantar</span>
                  )}
                </div>
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
                      {item.qty} {item.unit} / min {item.min}
                    </span>
                  </div>
                  <div className="stock-bar">
                    <div className={`stock-fill ${low ? 'low' : ''}`} style={{ width: `${Math.max(4, ratio)}%` }} />
                  </div>
                </div>
                <div className="mini-stepper">
                  <button type="button" onClick={() => adjustStock(item.id, -1)} aria-label="Kurangi stok">
                    −
                  </button>
                  <IonIcon icon={cubeOutline} color="medium" />
                  <button type="button" onClick={() => adjustStock(item.id, 1)} aria-label="Tambah stok">
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
