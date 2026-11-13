import React from 'react';

import { PublicShell } from '../../components/PublicShell';
import { useApp } from '../../store/AppStore';

const VALUES = [
  {
    emoji: '🌱',
    title: 'Bahan Segar Lokal',
    text: 'Biji kopi dari petani Jawa Barat, susu segar harian, dan bahan masakan tanpa pengawet.',
  },
  {
    emoji: '🤝',
    title: 'Pelayanan Hangat',
    text: 'Tim kami siap membantu dari pemesanan hingga pesanan tiba di kamar dengan senyum.',
  },
  {
    emoji: '⚡',
    title: 'Cepat & Terhubung',
    text: 'Satu sistem menyatukan tamu, kasir, dapur, dan manajemen hotel secara real-time.',
  },
];

const About: React.FC = () => {
  const { state } = useApp();

  return (
    <PublicShell active="/about">
      <section className="page-hero">
        <div className="container">
          <span className="pill">Tentang Kami</span>
          <h1>Lebih dari secangkir kopi.</h1>
          <p>
            Ngoffe ID lahir dari ide sederhana: tamu hotel seharusnya bisa menikmati kopi dan makanan favorit tanpa
            harus turun ke lobi. Kini, satu QR code menghubungkan kamar dengan café dan dapur kami.
          </p>
        </div>
      </section>

      <section className="section container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div>
            <span className="section-kicker">Cerita kami</span>
            <h2 className="section-title">Dari café kecil, tumbuh bersama hotel.</h2>
            <p className="muted" style={{ lineHeight: 1.75 }}>
              Berawal pada 2021 sebagai kedai kopi kecil di Bandung, Ngoffe ID dipercaya mengelola café hotel dengan
              konsep “room service tanpa ribet”. Setiap pesanan tercatat rapi, stok bahan baku terpantau, dan laporan
              penjualan tersedia untuk manajemen.
            </p>
            <p className="muted" style={{ lineHeight: 1.75 }}>
              Kami percaya teknologi tidak boleh menghilangkan kehangatan. Karena itu, sistem ini dirancang sederhana
              untuk tamu, namun lengkap untuk tim operasional.
            </p>
            <div className="row wrap" style={{ marginTop: 18 }}>
              <span className="pill soft">☕ Single origin</span>
              <span className="pill soft">🏨 15 kamar</span>
              <span className="pill soft">🌿 Local sourced</span>
            </div>
          </div>

          <div
            style={{
              borderRadius: 26,
              padding: 28,
              color: '#fff',
              background:
                'radial-gradient(circle at 80% 10%, rgba(63, 143, 95,.5), transparent 45%), linear-gradient(145deg,#123c2d,#1f5c45 60%,#2f7d60)',
              boxShadow: '0 26px 50px rgba(18, 60, 45,.28)',
            }}
          >
            <div style={{ fontSize: '4rem', lineHeight: 1 }}>☕</div>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.7rem',
                color: '#fff',
                margin: '18px 0 8px',
              }}
            >
              {state.settings.cafeName}
            </h3>
            <p style={{ color: 'rgba(255,255,255,.78)', lineHeight: 1.7, margin: 0 }}>{state.settings.tagline}</p>
            <div style={{ height: 1, background: 'rgba(255,255,255,.2)', margin: '20px 0' }} />
            <div className="row-between" style={{ color: 'rgba(255,255,255,.9)' }}>
              <span className="small">Sejak 2021</span>
              <span className="small">Bandung, Indonesia</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#e6f0e9' }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-kicker">Nilai kami</span>
              <h2 className="section-title">Yang membuat kami berbeda</h2>
            </div>
          </div>
          <div className="grid-auto">
            {VALUES.map((value) => (
              <div className="panel" key={value.title}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{value.emoji}</div>
                <h3 className="panel-title">{value.title}</h3>
                <p className="muted small" style={{ lineHeight: 1.65, margin: '8px 0 0' }}>
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="grid-auto">
          {[
            { value: '18+', label: 'Menu café & masakan' },
            { value: '15', label: 'Kamar terhubung QR' },
            { value: '3', label: 'Peran operasional' },
            { value: '4.9', label: 'Rating kepuasan tamu' },
          ].map((stat) => (
            <div className="panel center" key={stat.label}>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '2rem',
                  fontWeight: 700,
                }}
              >
                {stat.value}
              </div>
              <div className="muted small">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
};

export default About;
