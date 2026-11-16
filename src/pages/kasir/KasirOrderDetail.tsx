import { ImpactStyle } from '@capacitor/haptics';
import { IonButton, IonIcon, IonInput, IonModal, IonTextarea, IonToast, useIonRouter, useIonToast } from '@ionic/react';
import {
  arrowBackOutline,
  banOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  printOutline,
  receiptOutline,
  shareOutline,
  shieldCheckmarkOutline,
  timeOutline,
  cloudUploadOutline,
} from 'ionicons/icons';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import type { OrderStatus, RefundMethod } from '../../types';
import { formatDateTime, paymentLabel, rupiah, statusLabel } from '../../utils/format';
import { successFeedback, tapFeedback } from '../../utils/native';
import { shareReceipt } from '../../utils/share';

const KasirOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, setOrderStatus, voidOrder } = useApp();
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [toast, setToast] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('none');
  const [refundAmount, setRefundAmount] = useState(0);

  const order = state.orders.find((item) => item.id === id);

  if (!order) {
    return (
      <StaffShell title="Detail Pesanan">
        <div className="panel center" style={{ padding: 36 }}>
          <div style={{ fontSize: '2.4rem' }}>🔍</div>
          <h3>Pesanan tidak ditemukan</h3>
          <IonButton routerLink="/staff/kasir" style={{ marginTop: 12 }}>
            Kembali ke daftar
          </IonButton>
        </div>
      </StaffShell>
    );
  }

  const update = (status: OrderStatus, note: string, message: string) => {
    setOrderStatus(order.id, status, 'Kasir', note);
    setToast(message);
    if (status === 'siap_diantar' || status === 'selesai') {
      void successFeedback();
    } else {
      void tapFeedback(ImpactStyle.Medium);
    }
  };

  const openVoid = () => {
    const paid = order.status !== 'menunggu_pembayaran';
    setVoidReason('');
    setRefundMethod(paid ? order.payment : 'none');
    setRefundAmount(paid ? order.total : 0);
    void tapFeedback(ImpactStyle.Medium);
    setVoidOpen(true);
  };

  const submitVoid = () => {
    if (!voidReason.trim()) {
      void presentToast({
        message: 'Alasan void/refund wajib diisi agar tercatat di audit trail.',
        duration: 2400,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    voidOrder(order.id, {
      reason: voidReason,
      by: 'Kasir',
      refund: refundMethod,
      amount: refundMethod === 'none' ? 0 : refundAmount,
    });
    void successFeedback();
    setVoidOpen(false);
    setToast(
      refundMethod === 'none'
        ? 'Pesanan di-void dan tercatat di audit trail.'
        : `Refund ${rupiah(refundAmount)} dicatat di audit trail.`,
    );
  };

  const audits = state.audits.filter((entry) => entry.orderId === order.id);

  const canValidate = order.status === 'menunggu_validasi';
  const isCashPending = order.status === 'menunggu_pembayaran' && order.payment === 'cash';
  const isQrisPending = order.status === 'menunggu_pembayaran' && order.payment === 'qris';

  const share = async () => {
    const outcome = await shareReceipt(order, state.settings);
    void tapFeedback();
    if (outcome === 'cancelled') return;

    const message =
      outcome === 'shared'
        ? 'Struk siap dibagikan.'
        : outcome === 'copied'
          ? 'Struk disalin. Tempel ke WhatsApp atau chat lain.'
          : 'Struk tidak bisa dibagikan di perangkat ini.';

    void presentToast({
      message,
      duration: 2200,
      color: outcome === 'failed' ? 'danger' : 'success',
      position: 'top',
    });
  };

  return (
    <StaffShell
      title="Detail Pesanan"
      subtitle="Periksa pembayaran dan perbarui status pesanan."
      actions={
        <IonButton fill="outline" size="small" onClick={() => router.push('/staff/kasir')}>
          <IonIcon slot="start" icon={arrowBackOutline} />
          Kembali
        </IonButton>
      }
    >
      <div className="grid-auto" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="panel">
            <div className="row-between wrap">
              <div>
                <div className="order-code" style={{ fontSize: '1.05rem' }}>
                  {order.code}
                </div>
                <div className="order-meta" style={{ marginTop: 5 }}>
                  <span>🛏️ Kamar {order.room}</span>
                  <span>👤 {order.guestName}</span>
                  <span>🕒 {formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              <StatusBadge status={order.status} label={statusLabel[order.status]} />
            </div>

            <div className="divider" />

            <div className="row-between">
              <span className="muted small">Metode pembayaran</span>
              <span className="badge-soft">
                {paymentLabel[order.payment]}
                {order.proofName ? ' • bukti terunggah' : ''}
              </span>
            </div>
            <div className="row-between" style={{ marginTop: 8 }}>
              <span className="muted small">Total pesanan</span>
              <span className="order-total" style={{ fontSize: '1.15rem' }}>
                {rupiah(order.total)}
              </span>
            </div>
          </div>

          {order.payment === 'qris' && (
            <div className="panel">
              <h3 className="panel-title">Bukti Pembayaran</h3>
              {order.proofName ? (
                <div
                  style={{
                    marginTop: 10,
                    border: '1px dashed var(--ngoffe-line)',
                    borderRadius: 14,
                    padding: 16,
                    background: '#f6fbf7',
                  }}
                >
                  <div className="row" style={{ gap: 10 }}>
                    <span className="pay-icon">
                      <IonIcon icon={cloudUploadOutline} />
                    </span>
                    <div>
                      <strong className="small">{order.proofName}</strong>
                      <div className="muted small">Diunggah oleh tamu • status menunggu validasi</div>
                    </div>
                  </div>
                  <div className="muted small" style={{ marginTop: 10 }}>
                    Prototipe tidak menyimpan file gambar (hanya nama berkas). Di produksi, pratinjau bukti transfer
                    ditampilkan di sini.
                  </div>
                </div>
              ) : (
                <p className="muted small" style={{ marginTop: 8 }}>
                  Tamu belum mengunggah bukti transfer.
                </p>
              )}
            </div>
          )}

          {order.payment === 'cash' && (
            <div className="panel" style={{ background: '#e8f4ee', borderColor: '#c2d6ca' }}>
              <div className="row" style={{ gap: 10 }}>
                <span className="pay-icon">💵</span>
                <div>
                  <strong className="small">Pembayaran cash</strong>
                  <div className="muted small">Tagih {rupiah(order.total)} saat pesanan diantar ke kamar.</div>
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">Aksi Kasir</h3>
            <div className="stack-sm" style={{ marginTop: 10 }}>
              {canValidate && (
                <>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() =>
                      update('diproses', 'Pembayaran divalidasi kasir', 'Pembayaran valid, pesanan masuk dapur.')
                    }
                  >
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Validasi &amp; Kirim ke Dapur
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    onClick={() =>
                      update(
                        'menunggu_pembayaran',
                        'Pembayaran ditolak, tamu diminta unggah ulang',
                        'Pembayaran ditolak. Tamu diminta unggah ulang.',
                      )
                    }
                  >
                    <IonIcon slot="start" icon={closeCircleOutline} />
                    Tolak Pembayaran
                  </IonButton>
                </>
              )}

              {isCashPending && (
                <IonButton
                  expand="block"
                  color="success"
                  onClick={() =>
                    update('diproses', 'Cash dikonfirmasi kasir, pesanan masuk dapur', 'Pesanan cash dikonfirmasi.')
                  }
                >
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Konfirmasi Cash &amp; Kirim ke Dapur
                </IonButton>
              )}

              {isQrisPending && (
                <div className="panel" style={{ background: '#e8f4ee', border: 0, padding: 14 }}>
                  <strong className="small">Menunggu pembayaran tamu</strong>
                  <p className="muted small" style={{ margin: '4px 0 0' }}>
                    Pesanan akan masuk ke daftar validasi setelah tamu mengunggah bukti QRIS.
                  </p>
                </div>
              )}

              {order.status === 'diproses' && (
                <div className="panel" style={{ background: '#eaf3ed', border: 0, padding: 14 }}>
                  <strong className="small">Sedang disiapkan dapur</strong>
                  <p className="muted small" style={{ margin: '4px 0 0' }}>
                    Pantau dari dashboard Kitchen. Kasir akan menerima notifikasi saat pesanan siap diantar.
                  </p>
                </div>
              )}

              {order.status === 'siap_diantar' && (
                <IonButton
                  expand="block"
                  onClick={() => update('diantar', 'Pesanan mulai diantar ke kamar', 'Pesanan sedang diantar.')}
                >
                  Mulai Antar ke Kamar
                </IonButton>
              )}

              {order.status === 'diantar' && (
                <IonButton
                  expand="block"
                  color="success"
                  onClick={() => update('selesai', 'Pesanan diterima tamu', 'Pesanan selesai.')}
                >
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Selesaikan Pesanan
                </IonButton>
              )}

              {(order.status === 'selesai' || order.status === 'dibatalkan') && (
                <div className="muted small">
                  Pesanan sudah {statusLabel[order.status].toLowerCase()}. Tidak ada aksi lanjutan.
                </div>
              )}

              {order.status !== 'dibatalkan' && (
                <IonButton expand="block" fill="clear" color="danger" onClick={openVoid}>
                  <IonIcon slot="start" icon={banOutline} />
                  Void / Refund Pesanan
                </IonButton>
              )}

              <IonButton expand="block" fill="outline" onClick={() => window.print()}>
                <IonIcon slot="start" icon={printOutline} />
                Cetak Struk
              </IonButton>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Riwayat Status</h3>
            <div className="timeline" style={{ marginTop: 14 }}>
              {order.timeline.map((entry, index) => (
                <div
                  className={`timeline-item ${index === order.timeline.length - 1 ? 'current' : 'done'}`}
                  key={`${entry.status}-${entry.at}`}
                >
                  <div className="timeline-dot">
                    <IonIcon icon={timeOutline} />
                  </div>
                  <div className="timeline-body">
                    <strong>{statusLabel[entry.status]}</strong>
                    <span>
                      {formatDateTime(entry.at)} • {entry.by}
                    </span>
                    {entry.note && <p>{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {audits.length > 0 && (
            <div className="panel">
              <div className="row-between wrap" style={{ marginBottom: 10 }}>
                <h3 className="panel-title mb-0">Audit Void / Refund</h3>
                <span className="badge-soft danger">{audits.length} catatan</span>
              </div>
              <div className="audit-list">
                {audits.map((entry) => (
                  <div className="audit-row" key={entry.id}>
                    <span className={`audit-icon ${entry.action}`}>
                      <IonIcon icon={entry.action === 'refund' ? cashOutline : shieldCheckmarkOutline} />
                    </span>
                    <div className="grow">
                      <strong className="small">
                        {entry.action === 'refund'
                          ? `Refund ${rupiah(entry.amount)} (${entry.method.toUpperCase()})`
                          : 'Void tanpa refund'}
                      </strong>
                      <div className="muted small">
                        {formatDateTime(entry.at)} • {entry.by}
                      </div>
                      <p className="muted small" style={{ margin: '4px 0 0' }}>
                        Alasan: {entry.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Item Pesanan</h3>
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
            <div className="summary-row total">
              <span>Total</span>
              <span>{rupiah(order.total)}</span>
            </div>
          </div>

          <div className="panel">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <h3 className="panel-title mb-0">Struk Digital</h3>
              <div className="receipt-actions">
                <IonButton size="small" fill="clear" onClick={() => void share()}>
                  <IonIcon slot="start" icon={shareOutline} />
                  Bagikan
                </IonButton>
                <IonButton size="small" fill="clear" onClick={() => window.print()}>
                  <IonIcon slot="start" icon={printOutline} />
                  Print
                </IonButton>
              </div>
            </div>
            <div className="receipt">
              <h3>{state.settings.cafeName}</h3>
              <div className="receipt-center">{state.settings.tagline}</div>
              <div className="receipt-center">{state.settings.address}</div>
              <div className="receipt-center">{state.settings.phone}</div>
              <div className="receipt-line" />
              <div className="receipt-row">
                <span>No</span>
                <span>{order.code}</span>
              </div>
              <div className="receipt-row">
                <span>Kamar</span>
                <span>{order.room}</span>
              </div>
              <div className="receipt-row">
                <span>Tamu</span>
                <span>{order.guestName}</span>
              </div>
              <div className="receipt-row">
                <span>Waktu</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="receipt-line" />
              {order.items.map((item) => (
                <div key={`${item.menuId}-receipt`}>
                  <div className="receipt-row">
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span>{rupiah(item.price * item.qty)}</span>
                  </div>
                  {item.note && (
                    <div className="receipt-center" style={{ textAlign: 'left' }}>
                      * {item.note}
                    </div>
                  )}
                </div>
              ))}
              <div className="receipt-line" />
              <div className="receipt-row receipt-total">
                <span>TOTAL</span>
                <span>{rupiah(order.total)}</span>
              </div>
              <div className="receipt-row">
                <span>Bayar</span>
                <span>{paymentLabel[order.payment]}</span>
              </div>
              <div className="receipt-row">
                <span>Status</span>
                <span>{statusLabel[order.status]}</span>
              </div>
              {order.status === 'dibatalkan' && (
                <>
                  <div className="receipt-line" />
                  <div className="receipt-void">
                    VOID{order.refundAmount ? ` — REFUND ${rupiah(order.refundAmount)}` : ''}
                  </div>
                  {order.voidReason && <div className="receipt-center">Alasan: {order.voidReason}</div>}
                  {order.refundMethod && order.refundMethod !== 'none' && (
                    <div className="receipt-center">Refund via {order.refundMethod.toUpperCase()}</div>
                  )}
                </>
              )}
              <div className="receipt-line" />
              <div className="receipt-center">
                Terima kasih telah memesan.
                <br />
                Ngoffe ID — Café &amp; Hotel
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: '#eaf3ed', borderStyle: 'dashed' }}>
            <div className="row" style={{ gap: 10 }}>
              <IonIcon icon={receiptOutline} color="primary" />
              <div>
                <strong className="small">Alur pesanan</strong>
                <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                  Validasi → Dapur → Siap Antar → Diantar → Selesai. Setiap perubahan tercatat di riwayat status dan
                  terlihat oleh tamu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IonModal isOpen={voidOpen} onDidDismiss={() => setVoidOpen(false)} className="modal-sheet">
        <div className="modal-body">
          <div className="row" style={{ gap: 10, marginBottom: 4 }}>
            <span className="pay-icon danger">
              <IonIcon icon={banOutline} />
            </span>
            <div>
              <h3 className="panel-title mb-0">Void / Refund</h3>
              <div className="muted small">
                {order.code} • {rupiah(order.total)}
              </div>
            </div>
          </div>

          <p className="muted small" style={{ margin: '10px 0 14px', lineHeight: 1.55 }}>
            Pesanan akan ditandai <strong>Dibatalkan</strong>. Bahan yang sudah terpakai dapur dikembalikan ke stok, dan
            aksi ini tercatat permanen di audit trail.
          </p>

          <label className="field-label" htmlFor="void-reason">
            Alasan void / refund <span className="required">*</span>
          </label>
          <IonTextarea
            id="void-reason"
            className="field-input"
            autoGrow
            rows={3}
            placeholder="Contoh: tamu salah pesan, bahan habis, pembayaran ganda"
            value={voidReason}
            onIonInput={(event) => setVoidReason(event.detail.value ?? '')}
          />

          <div className="field-label" style={{ marginTop: 16 }}>
            Refund
          </div>
          <div className="chip-options">
            {(
              [
                { key: 'none', label: 'Tanpa refund' },
                { key: 'cash', label: 'Cash' },
                { key: 'qris', label: 'QRIS' },
              ] as { key: RefundMethod; label: string }[]
            ).map((option) => (
              <button
                type="button"
                key={option.key}
                className={`chip-option ${refundMethod === option.key ? 'active' : ''}`}
                onClick={() => {
                  setRefundMethod(option.key);
                  setRefundAmount(option.key === 'none' ? 0 : order.total);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {refundMethod !== 'none' && (
            <>
              <label className="field-label" htmlFor="refund-amount" style={{ marginTop: 16 }}>
                Nominal refund
              </label>
              <IonInput
                id="refund-amount"
                className="field-input"
                type="number"
                inputmode="numeric"
                min={0}
                max={order.total}
                value={refundAmount}
                onIonInput={(event) => setRefundAmount(Math.max(0, Number(event.detail.value ?? 0)))}
              />
              <div className="muted small" style={{ marginTop: 6 }}>
                Maksimal {rupiah(order.total)}.
              </div>
            </>
          )}

          <div className="row" style={{ gap: 10, marginTop: 22 }}>
            <IonButton expand="block" fill="outline" color="medium" onClick={() => setVoidOpen(false)}>
              Batal
            </IonButton>
            <IonButton expand="block" color="danger" disabled={!voidReason.trim()} onClick={submitVoid}>
              <IonIcon slot="start" icon={shieldCheckmarkOutline} />
              Catat Void
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonToast
        isOpen={Boolean(toast)}
        message={toast}
        duration={1800}
        color="success"
        position="top"
        onDidDismiss={() => setToast('')}
      />
    </StaffShell>
  );
};

export default KasirOrderDetail;
