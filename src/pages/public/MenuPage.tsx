import { IonButton, IonIcon } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { MenuCard } from '../../components/MenuCard';
import { PublicShell } from '../../components/PublicShell';
import { useApp } from '../../store/AppStore';
import type { MenuCategory } from '../../types';

const CATEGORIES: ('Semua' | MenuCategory)[] = ['Semua', 'Kopi', 'Non-Kopi', 'Makanan', 'Camilan'];

const MenuPage: React.FC = () => {
  const { state } = useApp();
  const [category, setCategory] = useState<'Semua' | MenuCategory>('Semua');
  const [query, setQuery] = useState('');

  const items = useMemo(
    () =>
      state.menu.filter((item) => {
        const matchCategory = category === 'Semua' || item.category === category;
        const matchQuery =
          !query.trim() ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase());
        return matchCategory && matchQuery;
      }),
    [state.menu, category, query],
  );

  return (
    <PublicShell active="/menu">
      <section className="page-hero">
        <div className="container">
          <span className="pill">Menu Kami</span>
          <h1>Dari espresso sampai camilan.</h1>
          <p>
            Semua menu diracik segar setiap hari. Pemesanan dilakukan melalui QR code di kamar hotel Anda agar pesanan
            langsung masuk ke kasir dan dapur.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="row-between wrap" style={{ marginBottom: 18, gap: 12 }}>
          <div className="category-chips">
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
          <div className="search-shell" style={{ minWidth: 220, flex: '0 1 280px' }}>
            <IonIcon icon={searchOutline} />
            <input
              placeholder="Cari menu…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Cari menu"
            />
          </div>
        </div>

        <div className="row-between" style={{ marginBottom: 12 }}>
          <span className="muted small">
            Menampilkan {items.length} dari {state.menu.length} menu
          </span>
          <span className="badge-soft">{category}</span>
        </div>

        {items.length ? (
          <div className="menu-grid">
            {items.map((item, index) => (
              <MenuCard
                key={item.id}
                item={item}
                index={index}
                action={
                  <IonButton size="small" fill="outline" routerLink="/order">
                    Pesan
                  </IonButton>
                }
              />
            ))}
          </div>
        ) : (
          <div className="panel center" style={{ padding: 40 }}>
            <div style={{ fontSize: '2.4rem' }}>🔍</div>
            <h3>Menu tidak ditemukan</h3>
            <p className="muted small">Coba kata kunci atau kategori lain.</p>
          </div>
        )}

        <div className="panel" style={{ marginTop: 26 }}>
          <div className="row-between wrap">
            <div>
              <strong>Ingin memesan sekarang?</strong>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Pindai QR di kamar atau pilih nomor kamar secara manual.
              </p>
            </div>
            <IonButton routerLink="/order">Buka Halaman Pesanan</IonButton>
          </div>
        </div>
      </section>
    </PublicShell>
  );
};

export default MenuPage;
