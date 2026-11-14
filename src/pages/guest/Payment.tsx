import { IonButton, IonIcon, useIonRouter, useIonToast } from '@ionic/react';
import { cameraOutline, cashOutline, checkmarkCircleOutline, qrCodeOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { FakeQr } from '../../components/FakeQr';
import { GuestShell } from '../../components/GuestShell';
import { useApp } from '../../store/AppStore';
import { paymentLabel, rupiah } from '../../utils/format';
import { successFeedback } from '../../utils/native';

const Payment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, uploadProof, setOrderStatus } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState('');

  const order = state.orders.find((item) => item.id === id);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  if (!order) {
    return (
      <GuestShell title="Pembayaran" showCart={false} backHref="/order">
        <div className="panel center" style={{ padding: 36 }}>
          <div style={{ fontSize: '2.4rem' }}>🧾</div>
          <h3>Pesanan tidak ditemukan</h3>
          <p className="muted small">Silakan buat pesanan baru dari halaman kamar.</p>
          <IonButton routerLink="/order" style={{ marginTop: 12 }}>
            Kembali
          </IonButton>
        </div>
      </GuestShell>
    );
  }

  if (order.status !== 'menunggu_pembayaran') {
    return <Navigate to={`/order/status/${order.id}`} replace />;
  }

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      void present({
        message: 'Bukti pembayaran harus berupa gambar.',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  };

  const confirm = () => {
    if (order.payment === 'qris') {
      if (!fileName) {
        void present({
          message: 'Unggah bukti transfer QRIS terlebih dahulu.',
          duration: 2200,
          color: 'warning',
          position: 'top',
        });
        return;
      }
      uploadProof(order.id, fileName);
      void present({
        message: 'Bukti pembayaran terkirim. Menunggu validasi kasir.',
        duration: 2400,
        color: 'success',
        position: 'top',
      });
    } else {
      setOrderStatus(order.id, 'menunggu_validasi', 'Tamu', 'Tamu memilih bayar cash saat pesanan diantar');
      void present({
        message: 'Pesanan dikonfirmasi. Siapkan uang cash saat pesanan tiba.',
        duration: 2600,
        color: 'success',
        position: 'top',
      });
    }
    void successFeedback();
    router.push(`/order/status/${order.id}`);
  };

  return (
    <GuestShell title="Pembayaran" showCart={false} backHref="/order/cart">
      <div className="panel center" style={{ marginBottom: 14 }}>
        <span className="section-kicker" style={{ justifyContent: 'center', display: 'flex' }}>
          {order.code}
        </span>
        <div className="muted small">Total yang harus dibayar</div>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '2.2rem',
            fontWeight: 700,
            color: 'var(--ngoffe-forest)',
          }}
        >
          {rupiah(order.total)}
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
          <span className="badge-soft">{paymentLabel[order.payment]}</span>
          <span className="badge-soft">Kamar {order.room}</span>
        </div>
      </div>

      {order.payment === 'qris' ? (
        <div className="panel">
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <IonIcon icon={qrCodeOutline} color="primary" />
            <h3 className="panel-title mb-0">Scan QRIS</h3>
          </div>
          <p className="panel-sub">
            Buka aplikasi mobile banking / e-wallet, pindai QR di bawah, lalu unggah bukti transfer.
          </p>
          <div style={{ margin: '18px 0' }}>
            <FakeQr seed={`${order.code}-${state.settings.qrisMerchant}`} />
            <div className="center small muted" style={{ marginTop: 10 }}>
              {state.settings.qrisMerchant}
            </div>
          </div>

          <div className="summary-row">
            <span>Nomor pesanan</span>
            <strong>{order.code}</strong>
          </div>
          <div className="summary-row">
            <span>Nominal</span>
            <strong>{rupiah(order.total)}</strong>
          </div>

          <div className="divider" />

          <label
            style={{
              display: 'block',
              border: '1.5px dashed var(--ngoffe-line)',
              borderRadius: 16,
              padding: 18,
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f6fbf7',
            }}
          >
            <input type="file" accept="image/*" hidden onChange={onFile} />
            <IonIcon icon={cameraOutline} color="primary" style={{ fontSize: 26 }} />
            <div style={{ fontWeight: 700, fontSize: '.86rem', marginTop: 6 }}>
              {fileName || 'Unggah bukti transfer'}
            </div>
            <div className="muted small">Format JPG/PNG, maksimal 5 MB</div>
          </label>

          {preview && (
            <img
              src={preview}
              alt="Pratinjau bukti transfer"
              style={{ width: '100%', borderRadius: 14, marginTop: 12, maxHeight: 220, objectFit: 'cover' }}
            />
          )}

          <IonButton expand="block" size="large" style={{ marginTop: 16 }} onClick={confirm}>
            <IonIcon slot="start" icon={checkmarkCircleOutline} />
            Konfirmasi Pembayaran
          </IonButton>
          <IonButton expand="block" fill="clear" routerLink={`/order/status/${order.id}`}>
            Bayar nanti
          </IonButton>
        </div>
      ) : (
        <div className="panel">
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <IonIcon icon={cashOutline} color="primary" />
            <h3 className="panel-title mb-0">Bayar Cash di Kamar</h3>
          </div>
          <p className="panel-sub">
            Tidak perlu transfer sekarang. Siapkan uang tunai sebesar nominal pesanan saat pesanan diantar ke kamar.
          </p>

          <div style={{ background: '#f6fbf7', borderRadius: 16, padding: 16, marginTop: 14 }}>
            <div className="summary-row">
              <span>Nominal cash</span>
              <strong>{rupiah(order.total)}</strong>
            </div>
            <div className="summary-row">
              <span>Diantar ke</span>
              <strong>Kamar {order.room}</strong>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 14, padding: 14, background: '#eaf3ed', border: 0 }}>
            <strong className="small">Yang perlu dilakukan</strong>
            <ol className="muted small" style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Tekan tombol konfirmasi di bawah.</li>
              <li>Kasir akan mengonfirmasi pesanan Anda.</li>
              <li>Bayar cash saat pesanan tiba di kamar.</li>
              <li>Simpan struk digital untuk bukti.</li>
            </ol>
          </div>

          <IonButton expand="block" size="large" style={{ marginTop: 16 }} onClick={confirm}>
            <IonIcon slot="start" icon={checkmarkCircleOutline} />
            Konfirmasi Pesanan
          </IonButton>
          <IonButton expand="block" fill="clear" routerLink={`/order/status/${order.id}`}>
            Bayar nanti
          </IonButton>
        </div>
      )}

      <div className="panel" style={{ marginTop: 14 }}>
        <h3 className="panel-title">Ringkasan Pesanan</h3>
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
    </GuestShell>
  );
};

export default Payment;
