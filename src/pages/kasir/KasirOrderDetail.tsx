import { ImpactStyle } from '@capacitor/haptics';
import { IonButton, IonIcon, IonToast, useIonAlert, useIonRouter } from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  printOutline,
  receiptOutline,
  timeOutline,
  cloudUploadOutline,
} from 'ionicons/icons';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { StaffShell } from '../../components/StaffShell';
import { StatusBadge } from '../../components/StatusBadge';
import { useApp } from '../../store/AppStore';
import type { OrderStatus } from '../../types';
import { formatDateTime, paymentLabel, rupiah, statusLabel } from '../../utils/format';
import { successFeedback, tapFeedback } from '../../utils/native';

const KasirOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, setOrderStatus, cancelOrder } = useApp();
  const router = useIonRouter();
  const [presentAlert] = useIonAlert();
  const [toast, setToast] = useState('');

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

  const confirmCancel = () => {
    void presentAlert({
      header: 'Batalkan pesanan?',
      message: 'Pesanan akan dibatalkan dan tamu melihat status Dibatalkan.',
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Alasan pembatalan' }],
      buttons: [
        { text: 'Tidak', role: 'cancel' },
        {
          text: 'Batalkan',
          role: 'destructive',
          handler: (data) => {
            cancelOrder(order.id, data?.reason || 'Dibatalkan oleh kasir', 'Kasir');
            setToast('Pesanan dibatalkan.');
          },
        },
      ],
    });
  };

  const canValidate = order.status === 'menunggu_validasi';
  const isCashPending = order.status === 'menunggu_pembayaran' && order.payment === 'cash';
  const isQrisPending = order.status === 'menunggu_pembayaran' && order.payment === 'qris';

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

              {order.status !== 'selesai' && order.status !== 'dibatalkan' && (
                <IonButton expand="block" fill="clear" color="danger" onClick={confirmCancel}>
                  Batalkan Pesanan
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
              <IonButton size="small" fill="clear" onClick={() => window.print()}>
                <IonIcon slot="start" icon={printOutline} />
                Print
              </IonButton>
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
