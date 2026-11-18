import { IonButton, IonIcon } from '@ionic/react';
import { arrowForwardOutline, cafeOutline, qrCodeOutline } from 'ionicons/icons';
import React, { Suspense } from 'react';

import { CountUp } from '../../components/CountUp';
import { MenuCard } from '../../components/MenuCard';
import { PublicShell } from '../../components/PublicShell';
import { ShowcaseSkeleton } from '../../components/Skeleton';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useApp } from '../../store/AppStore';
import { averageDeliveryMinutes } from '../../utils/format';

// Panggung 3D cukup berat; dimuat terpisah agar hero dan menu tampil lebih dulu.
const Showcase3D = React.lazy(() => import('../../components/Showcase3D'));

const STEPS = [
  { title: 'Scan QR Kamar', text: 'Arahkan kamera ke QR code yang ada di kamar hotel.' },
  { title: 'Pilih Menu', text: 'Jelajahi menu berdasarkan kategori, lengkap dengan foto.' },
  { title: 'Atur Keranjang', text: 'Tambah jumlah dan tulis catatan khusus pesanan.' },
  { title: 'Pilih Pembayaran', text: 'Bayar dengan QRIS atau cash saat pesanan diantar.' },
  { title: 'Pesanan Diantar', text: 'Pantau status pesanan sampai tiba di kamar Anda.' },
];

const revealStyle = (index: number): React.CSSProperties =>
  ({ '--reveal-delay': `${Math.min(index, 10) * 60}ms` }) as React.CSSProperties;

const Home: React.FC = () => {
  const { state } = useApp();
  const featured = state.menu.filter((item) => item.available).slice(0, 4);
  const menuTotal = state.menu.length;
  const activeRooms = state.rooms.filter((room) => room.active).length;
  const deliveryMinutes = averageDeliveryMinutes(state.orders) ?? 12;

  useScrollReveal();

  return (
    <PublicShell active="/">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="pill">☕ Café &amp; Hotel • Bandung</span>
            <h1>
              Kopi hangat,
              <br />
              <em>pesan dari kamar.</em>
            </h1>
            <p>
              Ngoffe ID menghubungkan café dan hotel dalam satu sistem. Pindai QR di kamar, pilih menu favorit, dan
              biarkan kami mengantarnya hangat ke pintu Anda.
            </p>
            <div className="hero-actions">
              <IonButton size="large" routerLink="/order">
                <IonIcon slot="start" icon={qrCodeOutline} />
                Scan QR &amp; Pesan
              </IonButton>
              <IonButton size="large" fill="outline" routerLink="/menu">
                <IonIcon slot="start" icon={cafeOutline} />
                Lihat Menu
              </IonButton>
            </div>
            <div className="hero-trust">
              <div>
                <strong>
                  <CountUp value={menuTotal} />
                </strong>
                <span>Menu pilihan</span>
              </div>
              <div>
                <strong>
                  <CountUp value={activeRooms} />
                </strong>
                <span>Kamar terhubung</span>
              </div>
              <div>
                <strong>
                  <CountUp value={deliveryMinutes} format={(value) => `${value} mnt`} />
                </strong>
                <span>Rata-rata antar</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-cup">☕</div>
            <div className="hero-badge top">
              <span>🛎️</span>
              <div>
                Antar ke kamar
                <br />
                <small className="muted">langsung dari dapur</small>
              </div>
            </div>
            <div className="hero-badge bottom">
              <span>📱</span>
              <div>
                Scan QR kamar
                <br />
                <small className="muted">tanpa buat akun</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="info-strip">
          <div className="info-card reveal" data-reveal style={revealStyle(0)}>
            <span className="info-icon">🕖</span>
            <div>
              <strong>Buka Setiap Hari</strong>
              <span>{state.settings.openHours}</span>
            </div>
          </div>
          <div className="info-card reveal" data-reveal style={revealStyle(1)}>
            <span className="info-icon">📱</span>
            <div>
              <strong>Pesan via QR</strong>
              <span>Tanpa antre, tanpa buat akun</span>
            </div>
          </div>
          <div className="info-card reveal" data-reveal style={revealStyle(2)}>
            <span className="info-icon">💳</span>
            <div>
              <strong>QRIS &amp; Cash</strong>
              <span>Bayar fleksibel saat pesan</span>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<ShowcaseSkeleton />}>
        <Showcase3D />
      </Suspense>

      <section className="section container">
        <div className="section-head reveal" data-reveal>
          <div>
            <span className="section-kicker">Paling dicari</span>
            <h2 className="section-title">Menu favorit tamu</h2>
          </div>
          <IonButton fill="clear" routerLink="/menu">
            Lihat semua menu
            <IonIcon slot="end" icon={arrowForwardOutline} />
          </IonButton>
        </div>
        <div className="menu-grid">
          {featured.map((item, index) => (
            <MenuCard
              key={item.id}
              item={item}
              index={index}
              reveal
              action={
                <IonButton size="small" fill="outline" routerLink="/order">
                  Pesan
                </IonButton>
              }
            />
          ))}
        </div>
      </section>

      <section className="section" style={{ background: '#e6f0e9' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-kicker">Mudah &amp; cepat</span>
              <h2 className="section-title">Lima langkah, pesanan siap</h2>
            </div>
            <p className="muted small" style={{ maxWidth: 340, margin: 0 }}>
              Seluruh alur terhubung: tamu, kasir, dapur, hingga laporan admin.
            </p>
          </div>
          <div className="steps">
            {STEPS.map((step, index) => (
              <div className="step-card reveal" data-reveal style={revealStyle(index)} key={step.title}>
                <div className="step-num">{index + 1}</div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="cta-banner reveal" data-reveal>
          <div>
            <h2>Sedang menginap? Pesan sekarang.</h2>
            <p>
              Pindai QR di kamar atau masukkan nomor kamar secara manual. Pesanan Anda langsung masuk ke kasir dan dapur
              kami.
            </p>
          </div>
          <IonButton color="light" size="large" routerLink="/order">
            Mulai Pesan
          </IonButton>
        </div>
      </section>
    </PublicShell>
  );
};

export default Home;
