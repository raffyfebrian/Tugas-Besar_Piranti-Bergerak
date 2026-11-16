import { IonButton, IonIcon, IonInput, IonTextarea, useIonToast } from '@ionic/react';
import {
  arrowBackOutline,
  cashOutline,
  checkmarkCircleOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { EmptyState } from '../../components/EmptyState';
import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { Order, Shift } from '../../types';
import { formatDateTime, formatTime, rupiah } from '../../utils/format';
import { successFeedback, tapFeedback } from '../../utils/native';

const salesFor = (orders: Order[], shift: Shift) => {
  const scoped = orders.filter(
    (order) =>
      order.createdAt >= shift.openedAt && order.status !== 'dibatalkan' && order.status !== 'menunggu_pembayaran',
  );
  const cashSales = scoped.filter((order) => order.payment === 'cash').reduce((total, order) => total + order.total, 0);
  const qrisSales = scoped.filter((order) => order.payment === 'qris').reduce((total, order) => total + order.total, 0);
  return { scoped, cashSales, qrisSales };
};

const KasirShift: React.FC = () => {
  const { state, openShift, closeShift } = useApp();
  const [present] = useIonToast();
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [note, setNote] = useState('');

  const session = state.session;
  const activeShift = useMemo(
    () => state.shifts.find((shift) => shift.status === 'open' && shift.staffId === session?.staffId),
    [state.shifts, session?.staffId],
  );

  const live = activeShift ? salesFor(state.orders, activeShift) : null;
  const expectedCash = activeShift && live ? activeShift.openingCash + live.cashSales : 0;
  const difference = closingCash - expectedCash;

  const shiftAudits = activeShift
    ? state.audits.filter((entry) => entry.at >= activeShift.openedAt)
    : state.audits.slice(0, 5);

  const closedShifts = state.shifts
    .filter((shift) => shift.status === 'closed')
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));

  const handleOpen = () => {
    const shift = openShift(openingCash);
    if (!shift) {
      void present({ message: 'Sesi staf tidak ditemukan. Silakan login ulang.', duration: 2400, color: 'danger' });
      return;
    }
    void successFeedback();
    setOpeningCash(0);
    void present({ message: 'Shift dibuka. Selamat bekerja!', duration: 2200, color: 'success', position: 'top' });
  };

  const handleClose = () => {
    void tapFeedback();
    closeShift(closingCash, note);
    setClosingCash(0);
    setNote('');
    void present({
      message: 'Shift ditutup dan rekonsiliasi kas tersimpan.',
      duration: 2600,
      color: 'success',
      position: 'top',
    });
  };

  return (
    <StaffShell
      title="Shift & Kas Kasir"
      subtitle="Buka shift, pantau penjualan, dan cocokkan uang fisik saat tutup kasir."
      actions={
        <IonButton fill="outline" size="small" routerLink="/staff/kasir">
          <IonIcon slot="start" icon={arrowBackOutline} />
          Pesanan
        </IonButton>
      }
    >
      <div className="grid-auto" style={{ alignItems: 'start' }}>
        <div className="stack">
          {activeShift ? (
            <div className="panel shift-active">
              <div className="row-between wrap">
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="shift-pulse" aria-hidden="true" />
                    <strong>Shift berjalan</strong>
                  </div>
                  <div className="muted small" style={{ marginTop: 4 }}>
                    {activeShift.staffName} • dibuka {formatDateTime(activeShift.openedAt)}
                  </div>
                </div>
                <span className="badge-soft success">OPEN</span>
              </div>

              <div className="shift-metrics">
                <div className="shift-metric">
                  <span className="muted small">Kas awal</span>
                  <strong>{rupiah(activeShift.openingCash)}</strong>
                </div>
                <div className="shift-metric">
                  <span className="muted small">Penjualan cash</span>
                  <strong>{rupiah(live?.cashSales ?? 0)}</strong>
                </div>
                <div className="shift-metric">
                  <span className="muted small">Penjualan QRIS</span>
                  <strong>{rupiah(live?.qrisSales ?? 0)}</strong>
                </div>
                <div className="shift-metric highlight">
                  <span className="muted small">Kas seharusnya</span>
                  <strong>{rupiah(expectedCash)}</strong>
                </div>
              </div>

              <div className="divider" />

              <h3 className="panel-title">Tutup shift</h3>
              <p className="muted small" style={{ margin: '2px 0 12px' }}>
                Masukkan jumlah uang fisik di laci kasir. Selisih dihitung otomatis dari penjualan cash selama shift.
              </p>
              <label className="field-label" htmlFor="closing-cash">
                Uang fisik di laci
              </label>
              <IonInput
                id="closing-cash"
                className="field-input"
                type="number"
                inputmode="numeric"
                min={0}
                value={closingCash}
                onIonInput={(event) => setClosingCash(Math.max(0, Number(event.detail.value ?? 0)))}
              />

              <div className={`shift-diff ${difference === 0 ? 'ok' : difference > 0 ? 'over' : 'short'}`}>
                <span>Selisih</span>
                <strong>
                  {difference === 0 ? 'Pas' : `${difference > 0 ? '+' : '−'}${rupiah(Math.abs(difference))}`}
                </strong>
              </div>

              <label className="field-label" htmlFor="closing-note" style={{ marginTop: 14 }}>
                Catatan (opsional)
              </label>
              <IonTextarea
                id="closing-note"
                className="field-input"
                autoGrow
                rows={2}
                placeholder="Contoh: kurang bayar Rp5.000, kembalian tidak tercatat"
                value={note}
                onIonInput={(event) => setNote(event.detail.value ?? '')}
              />

              <IonButton expand="block" color="success" style={{ marginTop: 18 }} onClick={handleClose}>
                <IonIcon slot="start" icon={lockClosedOutline} />
                Tutup shift &amp; cocokkan kas
              </IonButton>
            </div>
          ) : (
            <div className="panel">
              <div className="row" style={{ gap: 10 }}>
                <span className="pay-icon">
                  <IonIcon icon={walletOutline} />
                </span>
                <div>
                  <h3 className="panel-title mb-0">Belum ada shift aktif</h3>
                  <div className="muted small">Buka shift sebelum menerima pembayaran tunai.</div>
                </div>
              </div>

              <label className="field-label" htmlFor="opening-cash" style={{ marginTop: 18 }}>
                Kas awal di laci
              </label>
              <IonInput
                id="opening-cash"
                className="field-input"
                type="number"
                inputmode="numeric"
                min={0}
                value={openingCash}
                onIonInput={(event) => setOpeningCash(Math.max(0, Number(event.detail.value ?? 0)))}
              />

              <IonButton expand="block" style={{ marginTop: 18 }} onClick={handleOpen}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                Buka shift sekarang
              </IonButton>
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">Riwayat void / refund</h3>
            <p className="panel-sub">
              {activeShift ? 'Aksi sensitif yang tercatat selama shift berjalan.' : '5 catatan audit terbaru.'}
            </p>
            {shiftAudits.length === 0 ? (
              <EmptyState
                emoji="🛡️"
                title="Belum ada void atau refund"
                text="Setiap void/refund pesanan akan tercatat di sini beserta alasannya."
              />
            ) : (
              <div className="audit-list">
                {shiftAudits.map((entry) => (
                  <div className="audit-row" key={entry.id}>
                    <span className={`audit-icon ${entry.action}`}>
                      <IonIcon icon={entry.action === 'refund' ? cashOutline : shieldCheckmarkOutline} />
                    </span>
                    <div className="grow">
                      <div className="row-between wrap">
                        <strong className="small">{entry.orderCode}</strong>
                        <span className="muted small">{formatTime(entry.at)}</span>
                      </div>
                      <div className="muted small">
                        {entry.action === 'refund'
                          ? `Refund ${rupiah(entry.amount)} via ${entry.method.toUpperCase()}`
                          : 'Void tanpa refund'}{' '}
                        • {entry.by}
                      </div>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        {entry.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Shift selesai</h3>
            <p className="panel-sub">Rekonsiliasi kas yang sudah ditutup, terbaru di atas.</p>
            {closedShifts.length === 0 ? (
              <EmptyState
                emoji="🧾"
                title="Belum ada shift tertutup"
                text="Tutup shift pertama untuk melihat rekap kas di sini."
              />
            ) : (
              <div className="shift-list">
                {closedShifts.map((shift) => {
                  const diff = (shift.closingCash ?? 0) - (shift.expectedCash ?? 0);
                  return (
                    <div className="shift-card" key={shift.id}>
                      <div className="row-between wrap">
                        <strong className="small">{shift.staffName}</strong>
                        <span className="muted small">{shift.closedAt ? formatDateTime(shift.closedAt) : '-'}</span>
                      </div>
                      <div className="shift-card-grid">
                        <span>
                          Kas awal <strong>{rupiah(shift.openingCash)}</strong>
                        </span>
                        <span>
                          Cash <strong>{rupiah(shift.cashSales ?? 0)}</strong>
                        </span>
                        <span>
                          QRIS <strong>{rupiah(shift.qrisSales ?? 0)}</strong>
                        </span>
                        <span>
                          Seharusnya <strong>{rupiah(shift.expectedCash ?? 0)}</strong>
                        </span>
                        <span>
                          Fisik <strong>{rupiah(shift.closingCash ?? 0)}</strong>
                        </span>
                        <span className={diff === 0 ? 'ok' : diff > 0 ? 'over' : 'short'}>
                          Selisih{' '}
                          <strong>{diff === 0 ? 'Pas' : `${diff > 0 ? '+' : '−'}${rupiah(Math.abs(diff))}`}</strong>
                        </span>
                      </div>
                      <div className="muted small" style={{ marginTop: 8 }}>
                        {shift.orderCount ?? 0} pesanan • buka {formatTime(shift.openedAt)}
                        {shift.closedAt ? ` • tutup ${formatTime(shift.closedAt)}` : ''}
                      </div>
                      {shift.note && (
                        <p className="muted small" style={{ margin: '6px 0 0' }}>
                          Catatan: {shift.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel" style={{ background: '#eaf3ed', borderStyle: 'dashed' }}>
            <div className="row" style={{ gap: 10 }}>
              <IonIcon icon={timeOutline} color="primary" />
              <div>
                <strong className="small">Kenapa shift penting?</strong>
                <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                  Kas awal + penjualan cash = kas seharusnya. Saat tutup shift, kasir menghitung uang fisik agar selisih
                  langsung ketahuan dan tercatat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffShell>
  );
};

export default KasirShift;
