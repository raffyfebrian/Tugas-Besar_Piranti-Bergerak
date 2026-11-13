import { IonButton, IonContent, IonIcon, IonInput, IonPage, useIonRouter, useIonToast } from '@ionic/react';
import { cafeOutline, cardOutline, flameOutline, logInOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import React, { useState } from 'react';

import { useApp } from '../../store/AppStore';
import type { Role } from '../../types';
import { roleHome, roleLabel } from '../../utils/format';

const DEMO: { role: Role; email: string; password: string; name: string }[] = [
  { role: 'kasir', email: 'kasir@ngoffe.id', password: 'kasir123', name: 'Rina Kasir' },
  { role: 'kitchen', email: 'kitchen@ngoffe.id', password: 'kitchen123', name: 'Budi Dapur' },
  { role: 'admin', email: 'admin@ngoffe.id', password: 'admin123', name: 'Admin Ngoffe' },
];

const Login: React.FC = () => {
  const { state, login, logout } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [email, setEmail] = useState('admin@ngoffe.id');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<Role>('admin');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok || !result.role) {
      void present({
        message: result.message ?? 'Gagal masuk.',
        duration: 2200,
        color: 'danger',
        position: 'top',
      });
      return;
    }
    void present({
      message: `Selamat datang, ${roleLabel[result.role]}!`,
      duration: 1600,
      color: 'success',
      position: 'top',
    });
    router.push(roleHome[result.role]);
  };

  const chooseDemo = (account: (typeof DEMO)[number]) => {
    setRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <IonPage>
      <IonContent id="login-content" fullscreen>
        <div className="auth-wrap">
          <aside className="auth-side">
            <div>
              <div className="row">
                <span className="brand-mark">☕</span>
                <div>
                  <div className="brand-name">Ngoffe ID</div>
                  <div className="brand-tag" style={{ color: '#b7d9c7' }}>
                    Staff Workspace
                  </div>
                </div>
              </div>

              <h1>Satu dashboard untuk seluruh tim.</h1>
              <p>
                Kasir memvalidasi pembayaran, dapur menyiapkan pesanan, admin mengelola menu dan laporan. Semua
                terhubung dalam satu alur.
              </p>

              <div className="stack" style={{ marginTop: 28 }}>
                {[
                  { icon: cardOutline, title: 'Kasir', text: 'Validasi QRIS / cash, cetak struk, pantau transaksi.' },
                  { icon: flameOutline, title: 'Kitchen', text: 'Antrean pesanan, catatan khusus, stok bahan baku.' },
                  {
                    icon: shieldCheckmarkOutline,
                    title: 'Admin',
                    text: 'Menu, kamar, staf, laporan, dan pengaturan sistem.',
                  },
                ].map((item) => (
                  <div className="row" key={item.title} style={{ alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,.14)',
                        display: 'grid',
                        placeItems: 'center',
                        flex: '0 0 38px',
                      }}
                    >
                      <IonIcon icon={item.icon} />
                    </span>
                    <div>
                      <strong style={{ fontSize: '.88rem' }}>{item.title}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '.78rem', lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="small" style={{ color: 'rgba(255,255,255,.6)' }}>
              © {new Date().getFullYear()} Ngoffe ID • Sistem Pemesanan Café &amp; Hotel
            </div>
          </aside>

          <div className="auth-form">
            <div className="auth-card">
              <div className="center" style={{ marginBottom: 20 }}>
                <span
                  className="brand-mark"
                  style={{ margin: '0 auto 10px', width: 48, height: 48, fontSize: '1.4rem' }}
                >
                  ☕
                </span>
                <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
                  Masuk ke Workspace
                </h1>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Pilih peran, lalu gunakan akun demo di bawah.
                </p>
              </div>

              {state.session && (
                <div className="panel" style={{ marginBottom: 14, padding: 14, background: '#eaf3ed' }}>
                  <div className="row-between wrap">
                    <div>
                      <strong className="small">Sedang masuk sebagai {state.session.name}</strong>
                      <div className="muted small">{roleLabel[state.session.role]}</div>
                    </div>
                    <IonButton size="small" fill="outline" onClick={logout}>
                      Keluar
                    </IonButton>
                  </div>
                </div>
              )}

              <div className="segmented" style={{ marginBottom: 14 }}>
                {DEMO.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    className={`segment-btn ${role === account.role ? 'active' : ''}`}
                    onClick={() => chooseDemo(account)}
                  >
                    {roleLabel[account.role]}
                  </button>
                ))}
              </div>

              <form className="stack" onSubmit={submit}>
                <IonInput
                  label="Email"
                  labelPlacement="stacked"
                  fill="outline"
                  type="email"
                  value={email}
                  onIonInput={(event) => setEmail(event.detail.value ?? '')}
                  placeholder="nama@ngoffe.id"
                />
                <IonInput
                  label="Password"
                  labelPlacement="stacked"
                  fill="outline"
                  type="password"
                  value={password}
                  onIonInput={(event) => setPassword(event.detail.value ?? '')}
                  placeholder="••••••••"
                />
                <IonButton type="submit" expand="block" size="large">
                  <IonIcon slot="start" icon={logInOutline} />
                  Masuk sebagai {roleLabel[role]}
                </IonButton>
              </form>

              <div className="divider" />

              <div className="small muted" style={{ marginBottom: 8 }}>
                Akun demo (klik untuk mengisi):
              </div>
              <div className="stack-sm">
                {DEMO.map((account) => (
                  <div
                    className="demo-account"
                    key={account.email}
                    onClick={() => chooseDemo(account)}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <strong>{roleLabel[account.role]}</strong>
                      <div className="muted" style={{ fontSize: '.72rem' }}>
                        {account.name}
                      </div>
                    </div>
                    <code>
                      {account.email} / {account.password}
                    </code>
                  </div>
                ))}
              </div>

              <div className="center" style={{ marginTop: 18 }}>
                <IonButton fill="clear" routerLink="/" size="small">
                  <IonIcon slot="start" icon={cafeOutline} />
                  Kembali ke situs publik
                </IonButton>
                <IonButton fill="clear" routerLink="/order" size="small">
                  Pesan sebagai tamu
                </IonButton>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
