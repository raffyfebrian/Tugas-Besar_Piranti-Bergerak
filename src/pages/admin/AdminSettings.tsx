import { IonButton, IonIcon, IonInput, IonTextarea, useIonAlert, useIonRouter, useIonToast } from '@ionic/react';
import { refreshOutline, saveOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import React, { useState } from 'react';

import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { Settings } from '../../types';

const AdminSettings: React.FC = () => {
  const { state, updateSettings, resetDemo } = useApp();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();
  const [form, setForm] = useState<Settings>({ ...state.settings });

  const save = () => {
    if (!form.cafeName.trim()) {
      void present({ message: 'Nama café wajib diisi.', duration: 1600, color: 'warning', position: 'top' });
      return;
    }
    updateSettings(form);
    void present({ message: 'Pengaturan disimpan.', duration: 1700, color: 'success', position: 'top' });
  };

  const confirmReset = () => {
    void presentAlert({
      header: 'Reset data demo?',
      message: 'Semua pesanan, perubahan menu, staf, dan stok akan kembali ke data awal. Anda akan keluar dari sesi.',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Reset',
          role: 'destructive',
          handler: () => {
            resetDemo();
            void present({ message: 'Data demo berhasil direset.', duration: 1800, color: 'success', position: 'top' });
            router.push('/staff');
          },
        },
      ],
    });
  };

  const field = (
    key: keyof Settings,
    label: string,
    placeholder: string,
    type: 'text' | 'email' | 'tel' | 'url' = 'text',
  ) => (
    <IonInput
      label={label}
      labelPlacement="stacked"
      fill="outline"
      type={type}
      value={form[key]}
      onIonInput={(event) => setForm({ ...form, [key]: event.detail.value ?? '' })}
      placeholder={placeholder}
    />
  );

  return (
    <StaffShell
      title="Pengaturan Sistem"
      subtitle="Profil café, informasi pembayaran, dan data demo."
      actions={
        <IonButton size="small" onClick={save}>
          <IonIcon slot="start" icon={saveOutline} />
          Simpan
        </IonButton>
      }
    >
      <div className="grid-auto" style={{ alignItems: 'start' }}>
        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Profil Café</h3>
            <p className="panel-sub">Informasi ini tampil di situs publik, struk, dan halaman tamu.</p>
            <div className="stack" style={{ marginTop: 14 }}>
              {field('cafeName', 'Nama café', 'Ngoffe ID')}
              {field('tagline', 'Tagline', 'Café & Hotel Experience')}
              <IonTextarea
                label="Alamat"
                labelPlacement="stacked"
                fill="outline"
                rows={2}
                value={form.address}
                onIonInput={(event) => setForm({ ...form, address: event.detail.value ?? '' })}
              />
              <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
                {field('phone', 'Telepon', '+62 812-3456-7890', 'tel')}
                {field('email', 'Email', 'hello@ngoffe.id', 'email')}
              </div>
              {field('openHours', 'Jam operasional', '07.00 – 22.00 WIB')}
              {field('qrisMerchant', 'Merchant QRIS', 'NGOFFE ID • 9360 0012 3456')}
            </div>
          </div>

          <div className="panel">
            <div className="row-between">
              <div>
                <h3 className="panel-title">Simpan perubahan</h3>
                <p className="panel-sub">Perubahan langsung diterapkan tanpa restart.</p>
              </div>
              <IonButton onClick={save}>
                <IonIcon slot="start" icon={saveOutline} />
                Simpan
              </IonButton>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="row" style={{ gap: 10 }}>
              <span className="brand-mark">☕</span>
              <div>
                <strong>{form.cafeName || 'Ngoffe ID'}</strong>
                <div className="muted small">{form.tagline || 'Café & Hotel'}</div>
              </div>
            </div>
            <div className="divider" />
            <div className="contact-list">
              <div className="contact-item" style={{ padding: '10px 0' }}>
                <span className="contact-icon">📍</span>
                <div>
                  <strong>Alamat</strong>
                  <p>{form.address || '-'}</p>
                </div>
              </div>
              <div className="contact-item" style={{ padding: '10px 0' }}>
                <span className="contact-icon">📞</span>
                <div>
                  <strong>Kontak</strong>
                  <p>{form.phone || '-'}</p>
                </div>
              </div>
              <div className="contact-item" style={{ padding: '10px 0' }}>
                <span className="contact-icon">🕖</span>
                <div>
                  <strong>Jam buka</strong>
                  <p>{form.openHours || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="row" style={{ gap: 8 }}>
              <IonIcon icon={shieldCheckmarkOutline} color="primary" />
              <h3 className="panel-title mb-0">Informasi Aplikasi</h3>
            </div>
            <div className="divider" />
            <div className="summary-row">
              <span>Nama aplikasi</span>
              <span>Ngoffe ID</span>
            </div>
            <div className="summary-row">
              <span>Versi</span>
              <span>1.0.0 (prototipe)</span>
            </div>
            <div className="summary-row">
              <span>Framework</span>
              <span>Ionic React 9</span>
            </div>
            <div className="summary-row">
              <span>Build tool</span>
              <span>Vite 8 + TypeScript</span>
            </div>
            <div className="summary-row">
              <span>Penyimpanan</span>
              <span>localStorage</span>
            </div>
            <div className="summary-row">
              <span>Native shell</span>
              <span>Capacitor 8</span>
            </div>
          </div>

          <div className="panel" style={{ borderColor: 'rgba(191, 85, 70,.35)', background: '#fbf0ee' }}>
            <h3 className="panel-title" style={{ color: '#a2392b' }}>
              Zona Berbahaya
            </h3>
            <p className="panel-sub">
              Reset seluruh data demo ke kondisi awal (menu, staf, pesanan, stok). Tindakan ini tidak bisa dibatalkan.
            </p>
            <IonButton expand="block" color="danger" fill="outline" style={{ marginTop: 12 }} onClick={confirmReset}>
              <IonIcon slot="start" icon={refreshOutline} />
              Reset Data Demo
            </IonButton>
          </div>

          <div className="panel" style={{ background: '#eaf3ed', borderStyle: 'dashed' }}>
            <strong className="small">Catatan prototipe</strong>
            <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
              Aplikasi ini menyimpan data di browser (localStorage). Untuk tugas besar produksi, sambungkan ke REST API
              Laravel yang sudah ada atau gunakan backend terpisah.
            </p>
          </div>
        </div>
      </div>
    </StaffShell>
  );
};

export default AdminSettings;
