import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { speedometerOutline } from 'ionicons/icons';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { useApp } from '../store/AppStore';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/about', label: 'Tentang' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Galeri' },
  { href: '/contact', label: 'Kontak' },
];

export const Brand: React.FC<{ light?: boolean }> = ({ light }) => (
  <div className="brand">
    <span className="brand-mark">☕</span>
    <span className="brand-text">
      <span className="brand-name" style={light ? { color: '#fff' } : undefined}>
        Ngoffe ID
      </span>
      <span className="brand-tag">Café &amp; Hotel</span>
    </span>
  </div>
);

export const PublicShell: React.FC<React.PropsWithChildren<{ active?: string }>> = ({ children, active }) => {
  const location = useLocation();
  const router = useIonRouter();
  const { state } = useApp();
  const current = active ?? location.pathname;
  const staffActive = current.startsWith('/staff') || current.startsWith('/admin');

  return (
    <IonPage>
      <IonHeader className="public-header">
        <IonToolbar>
          <div slot="start" className="row" style={{ gap: 4, paddingLeft: 6 }}>
            <IonMenuButton menu="public-menu" className="mobile-only" />
            <div onClick={() => router.push('/')} role="button" tabIndex={0}>
              <Brand />
            </div>
          </div>
          <div slot="end" className="row" style={{ paddingRight: 8 }}>
            <div className="desktop-nav">
              {NAV.map((item) => (
                <IonButton
                  key={item.href}
                  fill="clear"
                  routerLink={item.href}
                  className={current === item.href ? 'active' : ''}
                >
                  {item.label}
                </IonButton>
              ))}
              <span className="nav-divider" aria-hidden="true" />
              <IonButton
                fill="clear"
                routerLink="/staff"
                className={`nav-staff${staffActive ? ' active' : ''}`}
                aria-label="Buka dashboard staf"
              >
                <IonIcon slot="start" icon={speedometerOutline} />
                Dashboard Staf
              </IonButton>
            </div>
            <IonButton size="small" routerLink="/order" style={{ marginLeft: 6 }}>
              Pesan Sekarang
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent id="public-content" fullscreen>
        {children}

        <footer className="public-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <Brand light />
                <p style={{ marginTop: 12 }}>
                  {state.settings.tagline}. Nikmati kopi, makanan, dan suasana hangat — pesan langsung dari kamar hotel
                  Anda.
                </p>
              </div>
              <div>
                <h4>Jelajahi</h4>
                {NAV.map((item) => (
                  <p key={item.href} style={{ margin: '0 0 6px' }}>
                    <a href={item.href} style={{ color: 'rgba(255,255,255,.72)', textDecoration: 'none' }}>
                      {item.label}
                    </a>
                  </p>
                ))}
              </div>
              <div>
                <h4>Kontak</h4>
                <p>{state.settings.address}</p>
                <p>{state.settings.phone}</p>
                <p>{state.settings.openHours}</p>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} Ngoffe ID. Prototipe Tugas Besar.</span>
              <span>
                <a href="/staff" style={{ color: 'rgba(255,255,255,.72)', textDecoration: 'none' }}>
                  Dashboard Staf →
                </a>
              </span>
            </div>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};
