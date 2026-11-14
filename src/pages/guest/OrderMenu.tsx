import { IonButton, IonIcon } from '@ionic/react';
import { add, searchOutline } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { QtyStepper } from '../../components/FakeQr';
import { GuestShell } from '../../components/GuestShell';
import { MenuCard } from '../../components/MenuCard';
import { useApp } from '../../store/AppStore';
import type { MenuCategory } from '../../types';
import { flyToCart } from '../../utils/flyToCart';
import { rupiah } from '../../utils/format';
import { tapFeedback } from '../../utils/native';

const CATEGORIES: ('Semua' | MenuCategory)[] = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Camilan'];

const OrderMenu: React.FC = () => {
  const { state, addToCart, decrementCart, cartCount, cartTotal } = useApp();
  const [category, setCategory] = useState<'Semua' | MenuCategory>('Semua');
  const [query, setQuery] = useState('');

  const items = useMemo(
    () =>
      state.menu.filter((item) => {
        const matchCategory = category === 'Semua' || item.category === category;
        const matchQuery = !query.trim() || item.name.toLowerCase().includes(query.toLowerCase());
        return matchCategory && matchQuery;
      }),
    [state.menu, category, query],
  );

  if (!state.room) return <Navigate to="/order" replace />;

  return (
    <GuestShell
      title="Menu Ngoffe ID"
      footer={
        <div className="cart-bar">
          <div>
            <small>{cartCount} item di keranjang</small>
            <strong>{rupiah(cartTotal)}</strong>
          </div>
          <IonButton routerLink="/order/cart" disabled={cartCount === 0}>
            Lihat Keranjang
          </IonButton>
        </div>
      }
    >
      <div className="row-between wrap" style={{ marginBottom: 14 }}>
        <div>
          <div className="room-chip">🛏️ Kamar {state.room}</div>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            Pesanan diantar langsung ke kamar Anda.
          </p>
        </div>
        <IonButton fill="clear" routerLink="/order" size="small">
          Ganti kamar
        </IonButton>
      </div>

      <div className="search-shell" style={{ marginBottom: 12 }}>
        <IonIcon icon={searchOutline} />
        <input
          placeholder="Cari menu…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Cari menu"
        />
      </div>

      <div className="category-chips" style={{ marginBottom: 16 }}>
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={`category-chip ${category === item ? 'active' : ''}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {items.length ? (
        <div className="menu-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))' }}>
          {items.map((item, index) => {
            const qty = state.cart.find((line) => line.menuId === item.id)?.qty ?? 0;
            return (
              <MenuCard
                key={item.id}
                item={item}
                index={index}
                action={
                  qty > 0 ? (
                    <QtyStepper qty={qty} onAdd={() => addToCart(item.id)} onRemove={() => decrementCart(item.id)} />
                  ) : (
                    <button
                      type="button"
                      className="round-add"
                      onClick={(event) => {
                        addToCart(item.id);
                        void tapFeedback();
                        flyToCart(event.currentTarget);
                      }}
                      disabled={!item.available}
                      aria-label={`Tambah ${item.name}`}
                    >
                      <IonIcon icon={add} />
                    </button>
                  )
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="panel center">
          <div style={{ fontSize: '2.2rem' }}>🔍</div>
          <h3>Menu tidak ditemukan</h3>
          <p className="muted small">Coba kategori atau kata kunci lain.</p>
        </div>
      )}

      <div className="panel" style={{ marginTop: 20, background: '#eaf3ed', borderStyle: 'dashed' }}>
        <strong className="small">Catatan penting</strong>
        <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
          Pesanan akan diteruskan ke kasir setelah Anda memilih metode pembayaran. Untuk QRIS, unggah bukti transfer
          agar pesanan divalidasi lebih cepat.
        </p>
      </div>
    </GuestShell>
  );
};

export default OrderMenu;
