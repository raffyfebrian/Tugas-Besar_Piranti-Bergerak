import { IonButton, IonIcon, IonInput, IonTextarea, useIonToast } from '@ionic/react';
import { callOutline, locationOutline, logoInstagram, logoWhatsapp, mailOutline, timeOutline } from 'ionicons/icons';
import React, { useState } from 'react';

import { PublicShell } from '../../components/PublicShell';
import { useApp } from '../../store/AppStore';

const Contact: React.FC = () => {
  const { state } = useApp();
  const [present] = useIonToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) {
      void present({
        message: 'Nama dan pesan wajib diisi.',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    void present({
      message: 'Terima kasih! Pesan Anda sudah kami terima.',
      duration: 2200,
      color: 'success',
      position: 'top',
    });
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <PublicShell active="/contact">
      <section className="page-hero">
        <div className="container">
          <span className="pill">Kontak</span>
          <h1>Kami siap membantu.</h1>
          <p>Punya pertanyaan tentang menu, reservasi, atau kerja sama? Hubungi kami melalui kanal di bawah ini.</p>
        </div>
      </section>

      <section className="section container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          <div className="panel">
            <h2 className="panel-title">Informasi Café</h2>
            <p className="panel-sub">Kunjungi kami atau hubungi langsung.</p>
            <div className="contact-list" style={{ marginTop: 10 }}>
              <div className="contact-item">
                <span className="contact-icon">
                  <IonIcon icon={locationOutline} />
                </span>
                <div>
                  <strong>Alamat</strong>
                  <p>{state.settings.address}</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <IonIcon icon={callOutline} />
                </span>
                <div>
                  <strong>Telepon / WhatsApp</strong>
                  <p>{state.settings.phone}</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <IonIcon icon={mailOutline} />
                </span>
                <div>
                  <strong>Email</strong>
                  <p>{state.settings.email}</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <IonIcon icon={timeOutline} />
                </span>
                <div>
                  <strong>Jam Operasional</strong>
                  <p>{state.settings.openHours}</p>
                </div>
              </div>
            </div>
            <div className="row wrap" style={{ marginTop: 14 }}>
              <IonButton size="small" fill="outline">
                <IonIcon slot="start" icon={logoWhatsapp} />
                WhatsApp
              </IonButton>
              <IonButton size="small" fill="outline">
                <IonIcon slot="start" icon={logoInstagram} />
                Instagram
              </IonButton>
            </div>
          </div>

          <form className="panel" onSubmit={send}>
            <h2 className="panel-title">Kirim Pesan</h2>
            <p className="panel-sub">Kami membalas dalam 1×24 jam kerja.</p>
            <div className="stack" style={{ marginTop: 14 }}>
              <IonInput
                label="Nama"
                labelPlacement="stacked"
                fill="outline"
                placeholder="Nama Anda"
                value={name}
                onIonInput={(event) => setName(event.detail.value ?? '')}
              />
              <IonInput
                label="Email"
                labelPlacement="stacked"
                fill="outline"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onIonInput={(event) => setEmail(event.detail.value ?? '')}
              />
              <IonTextarea
                label="Pesan"
                labelPlacement="stacked"
                fill="outline"
                rows={4}
                placeholder="Tulis pertanyaan atau masukan…"
                value={message}
                onIonInput={(event) => setMessage(event.detail.value ?? '')}
              />
              <IonButton type="submit" expand="block">
                Kirim Pesan
              </IonButton>
            </div>
          </form>
        </div>

        <div className="map-placeholder" style={{ marginTop: 24 }}>
          <div>
            <div style={{ fontSize: '2.4rem' }}>📍</div>
            <p style={{ margin: '8px 0 0' }}>{state.settings.address}</p>
            <p className="small" style={{ margin: 0, opacity: 0.75 }}>
              Peta interaktif dapat ditambahkan dengan Google Maps embed.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
};

export default Contact;
