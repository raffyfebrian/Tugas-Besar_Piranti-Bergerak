import React from 'react';

import { PublicShell } from '../../components/PublicShell';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const TILES = [
  { emoji: '☕', label: 'Bar & manual brew', gradient: 'linear-gradient(150deg,#123c2d,#2f7d60)', tall: true },
  { emoji: '🥐', label: 'Pastry panggang pagi', gradient: 'linear-gradient(150deg,#1b513d,#a9ddc9)' },
  { emoji: '🍽️', label: 'Plating menu utama', gradient: 'linear-gradient(150deg,#14442f,#6fbf95)' },
  { emoji: '🛏️', label: 'Kamar & room service', gradient: 'linear-gradient(150deg,#2f6f5e,#8fc4b1)' },
  { emoji: '🌿', label: 'Sudut hijau café', gradient: 'linear-gradient(150deg,#3f5b32,#a8c686)' },
  { emoji: '🥞', label: 'Sarapan & brunch', gradient: 'linear-gradient(150deg,#1f5c45,#bfe0cf)' },
  { emoji: '🍰', label: 'Dessert favorit', gradient: 'linear-gradient(150deg,#3b7a63,#d7ebe0)' },
  { emoji: '🌙', label: 'Suasana malam', gradient: 'linear-gradient(150deg,#0f2019,#1f5c45)' },
];

const revealStyle = (index: number): React.CSSProperties =>
  ({ '--reveal-delay': `${Math.min(index, 10) * 55}ms` }) as React.CSSProperties;

const Gallery: React.FC = () => {
  useScrollReveal();

  return (
    <PublicShell active="/gallery">
      <section className="page-hero">
        <div className="container">
          <span className="pill">Galeri</span>
          <h1>Suasana yang ingin kami bagikan.</h1>
          <p>Sudut café, hidangan, dan kamar hotel — semuanya dirancang agar Anda betah berlama-lama.</p>
        </div>
      </section>

      <section className="section container">
        <div className="gallery-grid">
          {TILES.map((tile, index) => (
            <div
              key={tile.label}
              className={`gallery-tile reveal${tile.tall ? ' tall' : ''}`}
              data-reveal
              style={{ background: tile.gradient, ...revealStyle(index) }}
            >
              <span className="big">{tile.emoji}</span>
              <p>{tile.label}</p>
            </div>
          ))}
        </div>
        <p className="muted small center reveal" data-reveal style={{ marginTop: 18 }}>
          Foto asli akan ditambahkan oleh tim dokumentasi. Untuk prototipe, galeri ditampilkan dengan ilustrasi bertema
          café.
        </p>
      </section>
    </PublicShell>
  );
};

export default Gallery;
