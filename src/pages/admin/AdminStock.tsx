import { IonButton, IonIcon, IonInput, IonModal, useIonAlert, useIonToast } from '@ionic/react';
import { addOutline, cubeOutline, pencilOutline, trashOutline, warningOutline } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { StockItem } from '../../types';

const emptyStock = (): StockItem => ({
  id: '',
  name: '',
  unit: 'kg',
  qty: 0,
  min: 1,
});

const AdminStock: React.FC = () => {
  const { state, saveStock, deleteStock, adjustStock } = useApp();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StockItem>(emptyStock());
  const [isEdit, setIsEdit] = useState(false);
  const [query, setQuery] = useState('');

  const lowStock = state.stock.filter((item) => item.qty <= item.min);

  const visible = useMemo(
    () =>
      [...state.stock]
        .filter((item) => !query.trim() || item.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          const aLow = a.qty <= a.min ? 0 : 1;
          const bLow = b.qty <= b.min ? 0 : 1;
          return aLow - bLow || a.name.localeCompare(b.name);
        }),
    [state.stock, query],
  );

  const openNew = () => {
    setForm(emptyStock());
    setIsEdit(false);
    setOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setForm(item);
    setIsEdit(true);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      void present({ message: 'Nama bahan wajib diisi.', duration: 1600, color: 'warning', position: 'top' });
      return;
    }
    saveStock({
      ...form,
      id: form.id || `stock-${Date.now().toString(36)}`,
      name: form.name.trim(),
      qty: Number(form.qty) || 0,
      min: Number(form.min) || 0,
    });
    setOpen(false);
    void present({
      message: isEdit ? 'Bahan diperbarui.' : 'Bahan baru ditambahkan.',
      duration: 1600,
      color: 'success',
      position: 'top',
    });
  };

  const confirmDelete = (item: StockItem) => {
    void presentAlert({
      header: 'Hapus bahan?',
      message: `${item.name} akan dihapus dari daftar stok.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            deleteStock(item.id);
            void present({ message: 'Bahan dihapus.', duration: 1500, color: 'medium', position: 'top' });
          },
        },
      ],
    });
  };

  return (
    <StaffShell
      title="Stok & Resep"
      subtitle="Pantau bahan baku, minimum stok, dan penyesuaian harian."
      actions={
        <IonButton size="small" onClick={openNew}>
          <IonIcon slot="start" icon={addOutline} />
          Tambah Bahan
        </IonButton>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={cubeOutline} />
          </div>
          <div className="kpi-label">Jenis Bahan</div>
          <div className="kpi-value">{state.stock.length}</div>
          <div className="kpi-note">Terdaftar di gudang</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">
            <IonIcon icon={warningOutline} />
          </div>
          <div className="kpi-label">Menipis</div>
          <div className="kpi-value">{lowStock.length}</div>
          <div className="kpi-note">Di bawah / sama dengan minimum</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Aman</div>
          <div className="kpi-value">{state.stock.length - lowStock.length}</div>
          <div className="kpi-note">Stok di atas minimum</div>
        </div>
      </div>

      <div className="panel">
        <div className="row-between wrap" style={{ marginBottom: 10 }}>
          <div>
            <h3 className="panel-title">Daftar bahan baku</h3>
            <p className="panel-sub">Gunakan tombol − / + untuk penyesuaian cepat.</p>
          </div>
          <div className="search-shell" style={{ minWidth: 200 }}>
            <input
              placeholder="Cari bahan…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Cari bahan"
            />
          </div>
        </div>

        {visible.map((item) => {
          const ratio = Math.min(100, Math.round((item.qty / Math.max(item.min * 2, 1)) * 100));
          const low = item.qty <= item.min;
          return (
            <div className="stock-row" key={item.id}>
              <div className="grow">
                <div className="row-between">
                  <strong className="small">
                    {item.name}
                    {low && (
                      <span className="badge-soft danger" style={{ marginLeft: 8 }}>
                        Menipis
                      </span>
                    )}
                  </strong>
                  <span className="muted small">
                    {item.qty} {item.unit} / min {item.min}
                  </span>
                </div>
                <div className="stock-bar">
                  <div className={`stock-fill ${low ? 'low' : ''}`} style={{ width: `${Math.max(4, ratio)}%` }} />
                </div>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <div className="mini-stepper">
                  <button type="button" onClick={() => adjustStock(item.id, -1)} aria-label="Kurangi">
                    −
                  </button>
                  <button type="button" onClick={() => adjustStock(item.id, 1)} aria-label="Tambah">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => openEdit(item)}
                  aria-label={`Edit ${item.name}`}
                >
                  <IonIcon icon={pencilOutline} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => confirmDelete(item)}
                  aria-label={`Hapus ${item.name}`}
                >
                  <IonIcon icon={trashOutline} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <div className="ion-padding" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="row-between">
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Bahan' : 'Tambah Bahan'}
              </h2>
              <p className="panel-sub">Tentukan satuan dan batas minimum stok.</p>
            </div>
            <IonButton fill="clear" onClick={() => setOpen(false)}>
              Tutup
            </IonButton>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <IonInput
              label="Nama bahan"
              labelPlacement="stacked"
              fill="outline"
              value={form.name}
              onIonInput={(event) => setForm({ ...form, name: event.detail.value ?? '' })}
              placeholder="Contoh: Biji Kopi Arabika"
            />
            <IonInput
              label="Satuan"
              labelPlacement="stacked"
              fill="outline"
              value={form.unit}
              onIonInput={(event) => setForm({ ...form, unit: event.detail.value ?? '' })}
              placeholder="kg / liter / pcs"
            />
            <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
              <IonInput
                label="Jumlah saat ini"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                value={form.qty}
                onIonInput={(event) => setForm({ ...form, qty: Number(event.detail.value ?? 0) })}
                style={{ flex: 1 }}
              />
              <IonInput
                label="Minimum stok"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                value={form.min}
                onIonInput={(event) => setForm({ ...form, min: Number(event.detail.value ?? 0) })}
                style={{ flex: 1 }}
              />
            </div>
            <IonButton expand="block" size="large" onClick={save}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Bahan'}
            </IonButton>
          </div>
        </div>
      </IonModal>
    </StaffShell>
  );
};

export default AdminStock;
