import { IonButton, IonIcon, IonInput, IonModal, useIonRouter, useIonToast } from '@ionic/react';
import { arrowForwardOutline, qrCodeOutline, searchOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { GuestShell } from '../../components/GuestShell';
import { useApp } from '../../store/AppStore';

const Scan: React.FC = () => {
  const { state, setRoom, orderByCode } = useApp();
  const router = useIonRouter();
  const location = useLocation();
  const [present] = useIonToast();
  const [openRooms, setOpenRooms] = useState(false);
  const [code, setCode] = useState('');

  const activeRooms = state.rooms.filter((room) => room.active);
  const floors = Array.from(new Set(activeRooms.map((room) => room.floor))).sort();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomParam = params.get('room');
    if (!roomParam) return;
    if (state.rooms.some((room) => room.number === roomParam && room.active)) {
      setRoom(roomParam);
      void present({
        message: `QR kamar ${roomParam} berhasil dipindai.`,
        duration: 1800,
        color: 'success',
        position: 'top',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const chooseRoom = (roomNumber: string) => {
    setRoom(roomNumber);
    setOpenRooms(false);
    void present({
      message: `Kamar ${roomNumber} terhubung. Selamat memesan!`,
      duration: 1600,
      color: 'success',
      position: 'top',
    });
    router.push('/order/menu');
  };

  const track = (event: React.FormEvent) => {
    event.preventDefault();
    const order = orderByCode(code);
    if (order) {
      router.push(`/order/status/${order.id}`);
    } else {
      void present({
        message: 'Kode pesanan tidak ditemukan. Periksa kembali.',
        duration: 2200,
        color: 'danger',
        position: 'top',
      });
    }
  };

  return (
    <GuestShell title="Pesan dari Kamar" showCart={false}>
      <div className="panel scan-card fade-up">
        <div className="scan-art">📷</div>
        <span className="section-kicker">Room service</span>
        <h1 className="section-title" style={{ marginBottom: 8 }}>
          Scan QR di kamar Anda
        </h1>
        <p className="muted" style={{ lineHeight: 1.65, marginTop: 0 }}>
          Arahkan kamera HP ke QR code yang tertempel di dekat pintu atau meja kamar. Nomor kamar akan otomatis terisi
          dan pesanan diantar ke tempat Anda.
        </p>

        {state.room ? (
          <div className="stack" style={{ marginTop: 18 }}>
            <div className="room-chip" style={{ alignSelf: 'center' }}>
              🛏️ Kamar {state.room} terhubung
            </div>
            <IonButton expand="block" size="large" onClick={() => router.push('/order/menu')}>
              Mulai Pesan
              <IonIcon slot="end" icon={arrowForwardOutline} />
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => setOpenRooms(true)}>
              Ganti kamar
            </IonButton>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 18 }}>
            <IonButton expand="block" size="large" onClick={() => setOpenRooms(true)}>
              <IonIcon slot="start" icon={qrCodeOutline} />
              Simulasikan Scan QR
            </IonButton>
            <p className="muted small" style={{ margin: 0 }}>
              Untuk demo, pilih nomor kamar yang tersedia. Di perangkat nyata, tombol ini terhubung ke kamera / Barcode
              Scanner Capacitor.
            </p>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h3 className="panel-title">Lacak pesanan</h3>
        <p className="panel-sub">Masukkan nomor pesanan, contoh: NGF-20261010-0001.</p>
        <form className="row" style={{ marginTop: 12, gap: 8 }} onSubmit={track}>
          <div className="search-shell grow">
            <IonIcon icon={searchOutline} />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="NGF-YYYYMMDD-0001"
              aria-label="Kode pesanan"
            />
          </div>
          <IonButton type="submit" style={{ margin: 0 }}>
            Lacak
          </IonButton>
        </form>
      </div>

      <div className="panel" style={{ marginTop: 18, background: '#eaf3ed', borderStyle: 'dashed' }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.6rem' }}>💡</span>
          <div>
            <strong className="small">Belum punya kamar?</strong>
            <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
              Pemesanan hanya tersedia untuk tamu hotel. Silakan hubungi resepsionis untuk mendapatkan akses QR kamar.
            </p>
          </div>
        </div>
      </div>

      <IonModal
        isOpen={openRooms}
        onDidDismiss={() => setOpenRooms(false)}
        initialBreakpoint={0.75}
        breakpoints={[0, 0.75, 1]}
      >
        <div className="ion-padding">
          <div className="row-between">
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>
                Pilih Kamar
              </h2>
              <p className="panel-sub">Simulasi hasil scan QR kamar.</p>
            </div>
            <IonButton fill="clear" onClick={() => setOpenRooms(false)}>
              Tutup
            </IonButton>
          </div>

          {floors.map((floor) => (
            <div key={floor} style={{ marginTop: 16 }}>
              <div className="section-kicker" style={{ marginBottom: 8 }}>
                Lantai {floor}
              </div>
              <div className="room-grid">
                {activeRooms
                  .filter((room) => room.floor === floor)
                  .map((room) => (
                    <button key={room.id} type="button" className="room-choice" onClick={() => chooseRoom(room.number)}>
                      <strong>{room.number}</strong>
                      <span>Kamar</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}

          <div className="divider" />
          <div className="search-shell">
            <IonInput
              label="Atau masukkan nomor kamar"
              labelPlacement="stacked"
              fill="outline"
              placeholder="contoh: 204"
              onIonChange={(event) => {
                const value = (event.detail.value ?? '').trim();
                if (value && activeRooms.some((room) => room.number === value)) {
                  chooseRoom(value);
                }
              }}
            />
          </div>
        </div>
      </IonModal>
    </GuestShell>
  );
};

export default Scan;
