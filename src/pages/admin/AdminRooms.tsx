import {
  IonButton,
  IonIcon,
  IonInput,
  IonModal,
  IonToggle,
  useIonAlert,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import {
  addOutline,
  copyOutline,
  openOutline,
  pencilOutline,
  printOutline,
  qrCodeOutline,
  trashOutline,
} from 'ionicons/icons';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { Room } from '../../types';

const roomLink = (room: Room) => `${window.location.origin}/order?room=${room.number}`;

const emptyRoom = (): Room => ({
  id: '',
  number: '',
  floor: 1,
  token: '',
  active: true,
});

const AdminRooms: React.FC = () => {
  const { state, saveRoom, deleteRoom } = useApp();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [open, setOpen] = useState(false);
  const [qrRoom, setQrRoom] = useState<Room | null>(null);
  const [printRooms, setPrintRooms] = useState<Room[] | null>(null);
  const [form, setForm] = useState<Room>(emptyRoom());
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-qr');
      setPrintRooms(null);
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      document.body.classList.remove('printing-qr');
    };
  }, []);

  const floors = Array.from(new Set(state.rooms.map((room) => room.floor))).sort();

  const openNew = () => {
    setForm(emptyRoom());
    setIsEdit(false);
    setOpen(true);
  };

  const openEdit = (room: Room) => {
    setForm(room);
    setIsEdit(true);
    setOpen(true);
  };

  const save = () => {
    const number = form.number.trim();
    if (!number) {
      void present({ message: 'Nomor kamar wajib diisi.', duration: 1600, color: 'warning', position: 'top' });
      return;
    }
    const duplicate = state.rooms.some((room) => room.number === number && room.id !== form.id);
    if (duplicate) {
      void present({ message: 'Nomor kamar sudah terdaftar.', duration: 1800, color: 'danger', position: 'top' });
      return;
    }
    saveRoom({
      ...form,
      id: form.id || `room-${number}-${Date.now().toString(36)}`,
      number,
      token: form.token || `NGF-RM-${number}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    });
    setOpen(false);
    void present({
      message: isEdit ? 'Data kamar diperbarui.' : 'Kamar baru ditambahkan.',
      duration: 1600,
      color: 'success',
      position: 'top',
    });
  };

  const confirmDelete = (room: Room) => {
    void presentAlert({
      header: 'Hapus kamar?',
      message: `Kamar ${room.number} tidak akan bisa memesan lagi.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            deleteRoom(room.id);
            void present({ message: 'Kamar dihapus.', duration: 1500, color: 'medium', position: 'top' });
          },
        },
      ],
    });
  };

  const copyLink = async (room: Room) => {
    const link = roomLink(room);
    try {
      await navigator.clipboard.writeText(link);
      void present({ message: 'Link pemesanan disalin.', duration: 1600, color: 'success', position: 'top' });
    } catch {
      void present({ message: link, duration: 3000, color: 'medium', position: 'top' });
    }
  };

  const printQr = (target?: Room) => {
    const rooms = target ? [target] : state.rooms.filter((room) => room.active);
    if (!rooms.length) {
      void present({ message: 'Belum ada QR aktif untuk dicetak.', duration: 1800, color: 'warning', position: 'top' });
      return;
    }
    setPrintRooms(rooms);
    window.setTimeout(() => {
      document.body.classList.add('printing-qr');
      window.print();
    }, 80);
  };

  return (
    <StaffShell
      title="Kamar & QR Code"
      subtitle="Setiap kamar memiliki QR unik untuk membuka halaman pemesanan tamu."
      actions={
        <>
          <IonButton size="small" fill="outline" onClick={() => printQr()}>
            <IonIcon slot="start" icon={printOutline} />
            Cetak Semua QR
          </IonButton>
          <IonButton size="small" onClick={openNew}>
            <IonIcon slot="start" icon={addOutline} />
            Tambah Kamar
          </IonButton>
        </>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={qrCodeOutline} />
          </div>
          <div className="kpi-label">Total Kamar</div>
          <div className="kpi-value">{state.rooms.length}</div>
          <div className="kpi-note">Terdaftar di sistem</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={qrCodeOutline} />
          </div>
          <div className="kpi-label">QR Aktif</div>
          <div className="kpi-value">{state.rooms.filter((room) => room.active).length}</div>
          <div className="kpi-note">Bisa menerima pesanan</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏨</div>
          <div className="kpi-label">Lantai</div>
          <div className="kpi-value">{floors.length}</div>
          <div className="kpi-note">Area kamar terhubung</div>
        </div>
      </div>

      <div className="panel">
        <div className="row-between">
          <div>
            <h3 className="panel-title">Daftar kamar</h3>
            <p className="panel-sub">Klik ikon QR untuk melihat dan menyalin link kamar.</p>
          </div>
        </div>

        {floors.map((floor) => (
          <div key={floor} style={{ marginTop: 14 }}>
            <div className="section-kicker">Lantai {floor}</div>
            {state.rooms
              .filter((room) => room.floor === floor)
              .map((room) => (
                <div className="manage-row" key={room.id}>
                  <div
                    className="manage-thumb"
                    style={{
                      background: room.active ? '#e6f1ea' : '#e9efeb',
                      color: room.active ? '#1f5c45' : '#87948c',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 700,
                    }}
                  >
                    {room.number}
                  </div>
                  <div className="grow">
                    <div className="row-between wrap">
                      <div>
                        <strong className="small">Kamar {room.number}</strong>
                        <div className="muted small">
                          {room.token} • {room.active ? 'QR aktif' : 'QR nonaktif'}
                        </div>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <IonToggle
                          checked={room.active}
                          onIonChange={() => saveRoom({ ...room, active: !room.active })}
                          style={{ transform: 'scale(.8)' }}
                        />
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setQrRoom(room)}
                          aria-label={`Lihat QR kamar ${room.number}`}
                        >
                          <IonIcon icon={qrCodeOutline} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => printQr(room)}
                          aria-label={`Cetak QR kamar ${room.number}`}
                        >
                          <IonIcon icon={printOutline} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEdit(room)}
                          aria-label={`Edit kamar ${room.number}`}
                        >
                          <IonIcon icon={pencilOutline} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => confirmDelete(room)}
                          aria-label={`Hapus kamar ${room.number}`}
                        >
                          <IonIcon icon={trashOutline} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16, background: '#eaf3ed', borderStyle: 'dashed' }}>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem' }}>💡</span>
          <div>
            <strong className="small">QR kamar siap dipindai</strong>
            <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
              QR dibuat langsung dari link <code>/order?room=nomor</code>, jadi bisa dipindai kamera HP. Gunakan tombol
              Cetak Semua QR untuk mencetak lembar QR semua kamar aktif, atau cetak satu QR dari jendela detail kamar.
            </p>
          </div>
        </div>
      </div>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <div className="ion-padding" style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="row-between">
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Kamar' : 'Tambah Kamar'}
              </h2>
              <p className="panel-sub">Token QR dibuat otomatis bila dikosongkan.</p>
            </div>
            <IonButton fill="clear" onClick={() => setOpen(false)}>
              Tutup
            </IonButton>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
              <IonInput
                label="Nomor kamar"
                labelPlacement="stacked"
                fill="outline"
                value={form.number}
                onIonInput={(event) => setForm({ ...form, number: event.detail.value ?? '' })}
                placeholder="204"
                style={{ flex: 1 }}
              />
              <IonInput
                label="Lantai"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                value={form.floor}
                onIonInput={(event) => setForm({ ...form, floor: Number(event.detail.value ?? 1) })}
                style={{ flex: '0 0 110px' }}
              />
            </div>
            <IonInput
              label="Token QR"
              labelPlacement="stacked"
              fill="outline"
              value={form.token}
              onIonInput={(event) => setForm({ ...form, token: event.detail.value ?? '' })}
              placeholder="NGF-RM-204-XXXX"
            />
            <div className="row-between">
              <span className="small">QR aktif</span>
              <IonToggle
                checked={form.active}
                onIonChange={(event) => setForm({ ...form, active: event.detail.checked })}
              />
            </div>
            <IonButton expand="block" size="large" onClick={save}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Kamar'}
            </IonButton>
          </div>
        </div>
      </IonModal>

      <IonModal isOpen={Boolean(qrRoom)} onDidDismiss={() => setQrRoom(null)}>
        {qrRoom && (
          <div className="ion-padding" style={{ textAlign: 'center' }}>
            <div className="section-kicker" style={{ display: 'block' }}>
              QR Pemesanan
            </div>
            <h2 className="section-title" style={{ fontSize: '1.6rem' }}>
              Kamar {qrRoom.number}
            </h2>
            <p className="muted small">Token: {qrRoom.token}</p>
            <div className="qr-modal-code" style={{ margin: '18px 0' }}>
              <QRCodeSVG
                value={roomLink(qrRoom)}
                size={230}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#123c2d"
                title={`QR pemesanan kamar ${qrRoom.number}`}
              />
            </div>
            <div
              style={{
                background: '#eaf3ed',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: '.74rem',
                wordBreak: 'break-all',
                marginBottom: 14,
              }}
            >
              {roomLink(qrRoom)}
            </div>
            <div className="stack-sm">
              <IonButton expand="block" fill="outline" onClick={() => copyLink(qrRoom)}>
                <IonIcon slot="start" icon={copyOutline} />
                Salin Link
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => printQr(qrRoom)}>
                <IonIcon slot="start" icon={printOutline} />
                Cetak QR Kamar
              </IonButton>
              <IonButton
                expand="block"
                onClick={() => {
                  const number = qrRoom.number;
                  setQrRoom(null);
                  router.push(`/order?room=${number}`);
                }}
              >
                <IonIcon slot="start" icon={openOutline} />
                Buka Halaman Pesanan
              </IonButton>
              <IonButton expand="block" fill="clear" onClick={() => setQrRoom(null)}>
                Tutup
              </IonButton>
            </div>
          </div>
        )}
      </IonModal>

      {printRooms &&
        createPortal(
          <section className="qr-print-sheet">
            <header className="qr-print-head">
              <div>
                <strong>{state.settings.cafeName}</strong>
                <span>QR pemesanan kamar</span>
              </div>
              <span>{printRooms.length} kamar</span>
            </header>
            <div className="qr-print-grid">
              {printRooms.map((room) => (
                <article className="qr-print-card" key={room.id}>
                  <QRCodeSVG
                    value={roomLink(room)}
                    size={160}
                    level="M"
                    marginSize={2}
                    bgColor="#ffffff"
                    fgColor="#123c2d"
                    title={`QR pemesanan kamar ${room.number}`}
                  />
                  <strong>Kamar {room.number}</strong>
                  <span>Scan untuk memesan</span>
                  <small>{roomLink(room)}</small>
                </article>
              ))}
            </div>
          </section>,
          document.body,
        )}
    </StaffShell>
  );
};

export default AdminRooms;
