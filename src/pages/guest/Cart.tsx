import { IonButton, IonIcon, IonInput, IonTextarea, useIonRouter, useIonToast } from '@ionic/react';
import { cashOutline, qrCodeOutline, trashOutline } from 'ionicons/icons';
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { QtyStepper } from '../../components/FakeQr';
import { GuestShell } from '../../components/GuestShell';
import { useApp } from '../../store/AppStore';
import type { PaymentMethod } from '../../types';
import { rupiah } from '../../utils/format';

const Cart: React.FC = () => {
  const {
    state,
    addToCart,
    decrementCart,
    removeFromCart,
    setLineNote,
    setGuestName,
    cartCount,
    cartTotal,
    placeOrder,
  } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [payment, setPayment] = useState<PaymentMethod>('qris');

  if (!state.room) return <Navigate to="/order" replace />;

  const submit = () => {
    const order = placeOrder(payment);
    if (!order) {
      void present({
        message: 'Keranjang masih kosong atau kamar belum dipilih.',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    router.push(`/order/payment/${order.id}`);
  };

  return (
    <GuestShell title="Keranjang Pesanan" backHref="/order/menu">
      <div className="row-between wrap" style={{ marginBottom: 14 }}>
        <div>
          <div className="room-chip">🛏️ Kamar {state.room}</div>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            Periksa pesanan sebelum melanjutkan.
          </p>
        </div>
        <IonButton fill="clear" size="small" routerLink="/order/menu">
          Tambah menu
        </IonButton>
      </div>

      {state.cart.length === 0 ? (
        <div className="panel center" style={{ padding: 36 }}>
          <div style={{ fontSize: '2.6rem' }}>🛒</div>
          <h3>Keranjang masih kosong</h3>
          <p className="muted small">Yuk pilih kopi atau makanan favorit Anda.</p>
          <IonButton style={{ marginTop: 14 }} routerLink="/order/menu">
            Lihat Menu
          </IonButton>
        </div>
      ) : (
        <div className="stack">
          <div className="panel">
            {state.cart.map((line) => {
              const item = state.menu.find((menu) => menu.id === line.menuId);
              if (!item) return null;
              return (
                <div className="cart-line" key={line.menuId}>
                  <div className="cart-thumb" style={{ background: item.gradient }}>
                    {item.emoji}
                  </div>
                  <div className="grow">
                    <div className="row-between">
                      <div>
                        <h4>{item.name}</h4>
                        <span className="price small">{rupiah(item.price)}</span>
                      </div>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Hapus ${item.name}`}
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                    <div className="row-between" style={{ marginTop: 8 }}>
                      <QtyStepper
                        qty={line.qty}
                        onAdd={() => addToCart(item.id)}
                        onRemove={() => decrementCart(item.id)}
                        min={1}
                      />
                      <strong className="small">{rupiah(item.price * line.qty)}</strong>
                    </div>
                    <IonTextarea
                      className="cart-note"
                      placeholder="Catatan (mis. tanpa gula, extra shot)…"
                      autoGrow
                      rows={1}
                      value={line.note}
                      onIonInput={(event) => setLineNote(item.id, event.detail.value ?? '')}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panel">
            <h3 className="panel-title">Nama tamu (opsional)</h3>
            <p className="panel-sub">Supaya kasir dan kurir mudah menemukan Anda.</p>
            <IonInput
              fill="outline"
              placeholder="Nama Anda"
              value={state.guestName}
              onIonInput={(event) => setGuestName(event.detail.value ?? '')}
              style={{ marginTop: 10 }}
            />
          </div>

          <div className="panel">
            <h3 className="panel-title">Metode pembayaran</h3>
            <p className="panel-sub">Pilih salah satu, bisa diubah sebelum konfirmasi.</p>
            <div className="stack" style={{ marginTop: 12 }}>
              <div
                className={`pay-option ${payment === 'qris' ? 'active' : ''}`}
                onClick={() => setPayment('qris')}
                role="button"
                tabIndex={0}
              >
                <span className="pay-icon">
                  <IonIcon icon={qrCodeOutline} />
                </span>
                <div className="grow">
                  <strong>QRIS</strong>
                  <span>Transfer via mobile banking, unggah bukti bayar.</span>
                </div>
                <span className={`badge-soft ${payment === 'qris' ? 'success' : ''}`}>
                  {payment === 'qris' ? 'Dipilih' : 'Pilih'}
                </span>
              </div>
              <div
                className={`pay-option ${payment === 'cash' ? 'active' : ''}`}
                onClick={() => setPayment('cash')}
                role="button"
                tabIndex={0}
              >
                <span className="pay-icon">
                  <IonIcon icon={cashOutline} />
                </span>
                <div className="grow">
                  <strong>Cash</strong>
                  <span>Bayar tunai saat pesanan diantar ke kamar.</span>
                </div>
                <span className={`badge-soft ${payment === 'cash' ? 'success' : ''}`}>
                  {payment === 'cash' ? 'Dipilih' : 'Pilih'}
                </span>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Ringkasan</h3>
            <div className="summary-row">
              <span>Subtotal ({cartCount} item)</span>
              <span>{rupiah(cartTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Biaya layanan kamar</span>
              <span>Gratis</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{rupiah(cartTotal)}</span>
            </div>
            <IonButton expand="block" size="large" style={{ marginTop: 14 }} onClick={submit}>
              Lanjut ke Pembayaran
            </IonButton>
          </div>
        </div>
      )}
    </GuestShell>
  );
};

export default Cart;
