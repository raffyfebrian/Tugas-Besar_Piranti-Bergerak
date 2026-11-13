import {
  IonButton,
  IonIcon,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToggle,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, pencilOutline, searchOutline, trashOutline } from 'ionicons/icons';
import React, { useMemo, useState } from 'react';

import { MenuCard } from '../../components/MenuCard';
import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { MenuCategory, MenuItem } from '../../types';
import { rupiah } from '../../utils/format';

const CATEGORIES: MenuCategory[] = ['Kopi', 'Non-Kopi', 'Makanan', 'Camilan'];

const GRADIENTS = [
  { label: 'Hijau pinus', value: 'linear-gradient(135deg, #123c2d, #2f7d60)' },
  { label: 'Mint lembut', value: 'linear-gradient(135deg, #2f7d60, #b7d9c7)' },
  { label: 'Matcha', value: 'linear-gradient(135deg, #3f5b32, #a8c686)' },
  { label: 'Hijau limau', value: 'linear-gradient(135deg, #3f5b32, #b9d99b)' },
  { label: 'Hijau zamrud', value: 'linear-gradient(135deg, #3b7a63, #d7ebe0)' },
  { label: 'Malam hijau', value: 'linear-gradient(135deg, #10241b, #1f5c45)' },
];

const emptyForm = (): MenuItem => ({
  id: '',
  name: '',
  category: 'Kopi',
  price: 20000,
  description: '',
  emoji: '☕',
  gradient: GRADIENTS[0].value,
  available: true,
});

const AdminMenu: React.FC = () => {
  const { state, saveMenuItem, deleteMenuItem, toggleMenuAvailability } = useApp();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'Semua' | MenuCategory>('Semua');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MenuItem>(emptyForm());
  const [isEdit, setIsEdit] = useState(false);

  const visible = useMemo(
    () =>
      state.menu.filter((item) => {
        const matchCategory = category === 'Semua' || item.category === category;
        const matchQuery = !query.trim() || item.name.toLowerCase().includes(query.toLowerCase());
        return matchCategory && matchQuery;
      }),
    [state.menu, category, query],
  );

  const openNew = () => {
    setForm(emptyForm());
    setIsEdit(false);
    setOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm(item);
    setIsEdit(true);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      void present({ message: 'Nama menu wajib diisi.', duration: 1800, color: 'warning', position: 'top' });
      return;
    }
    if (!form.price || form.price <= 0) {
      void present({ message: 'Harga harus lebih dari 0.', duration: 1800, color: 'warning', position: 'top' });
      return;
    }
    saveMenuItem({
      ...form,
      id: form.id || `menu-${Date.now().toString(36)}`,
      name: form.name.trim(),
      description: form.description.trim(),
    });
    setOpen(false);
    void present({
      message: isEdit ? 'Menu berhasil diperbarui.' : 'Menu baru ditambahkan.',
      duration: 1800,
      color: 'success',
      position: 'top',
    });
  };

  const confirmDelete = (item: MenuItem) => {
    void presentAlert({
      header: 'Hapus menu?',
      message: `${item.name} akan dihapus dari daftar menu.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            deleteMenuItem(item.id);
            void present({ message: 'Menu dihapus.', duration: 1600, color: 'medium', position: 'top' });
          },
        },
      ],
    });
  };

  return (
    <StaffShell
      title="Menu & Kategori"
      subtitle="Kelola daftar menu, harga, deskripsi, dan ketersediaan."
      actions={
        <IonButton size="small" onClick={openNew}>
          <IonIcon slot="start" icon={addOutline} />
          Tambah Menu
        </IonButton>
      }
    >
      <div className="row-between wrap" style={{ marginBottom: 12, gap: 10 }}>
        <div className="category-chips">
          {(['Semua', ...CATEGORIES] as ('Semua' | MenuCategory)[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`category-chip ${category === item ? 'active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="search-shell" style={{ minWidth: 220, flex: '0 1 280px' }}>
          <IonIcon icon={searchOutline} />
          <input
            placeholder="Cari menu…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Cari menu"
          />
        </div>
      </div>

      <div className="panel">
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div>
            <h3 className="panel-title">Daftar menu ({visible.length})</h3>
            <p className="panel-sub">
              {state.menu.filter((item) => item.available).length} menu aktif dari {state.menu.length} total
            </p>
          </div>
          <span className="badge-soft">{category}</span>
        </div>

        {visible.map((item) => (
          <div className="manage-row" key={item.id}>
            <div className="manage-thumb" style={{ background: item.gradient }}>
              {item.emoji}
            </div>
            <div className="grow">
              <div className="row-between wrap">
                <div>
                  <strong className="small">{item.name}</strong>
                  <div className="muted small">
                    {item.category} • {rupiah(item.price)}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <IonToggle
                    checked={item.available}
                    onIonChange={() => toggleMenuAvailability(item.id)}
                    style={{ transform: 'scale(.82)' }}
                  />
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
            </div>
          </div>
        ))}
      </div>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <div className="ion-padding" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="row-between">
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Menu' : 'Tambah Menu'}
              </h2>
              <p className="panel-sub">Perubahan langsung diterapkan ke halaman tamu.</p>
            </div>
            <IonButton fill="clear" onClick={() => setOpen(false)}>
              Tutup
            </IonButton>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <IonInput
              label="Nama menu"
              labelPlacement="stacked"
              fill="outline"
              value={form.name}
              onIonInput={(event) => setForm({ ...form, name: event.detail.value ?? '' })}
              placeholder="Contoh: Kopi Susu Gula Aren"
            />
            <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
              <IonSelect
                label="Kategori"
                labelPlacement="stacked"
                fill="outline"
                value={form.category}
                onIonChange={(event) => setForm({ ...form, category: event.detail.value as MenuCategory })}
                style={{ flex: 1 }}
              >
                {CATEGORIES.map((item) => (
                  <IonSelectOption key={item} value={item}>
                    {item}
                  </IonSelectOption>
                ))}
              </IonSelect>
              <IonInput
                label="Harga (Rp)"
                labelPlacement="stacked"
                fill="outline"
                type="number"
                value={form.price}
                onIonInput={(event) => setForm({ ...form, price: Number(event.detail.value ?? 0) })}
                style={{ flex: 1 }}
              />
            </div>
            <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
              <IonInput
                label="Emoji"
                labelPlacement="stacked"
                fill="outline"
                value={form.emoji}
                onIonInput={(event) => setForm({ ...form, emoji: event.detail.value ?? '' })}
                style={{ flex: '0 0 110px' }}
              />
              <IonSelect
                label="Warna kartu"
                labelPlacement="stacked"
                fill="outline"
                value={form.gradient}
                onIonChange={(event) => setForm({ ...form, gradient: event.detail.value as string })}
                style={{ flex: 1 }}
              >
                {GRADIENTS.map((item) => (
                  <IonSelectOption key={item.label} value={item.value}>
                    {item.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
            <IonTextarea
              label="Deskripsi"
              labelPlacement="stacked"
              fill="outline"
              rows={3}
              value={form.description}
              onIonInput={(event) => setForm({ ...form, description: event.detail.value ?? '' })}
              placeholder="Bahan utama, rasa, dan penyajian."
            />
            <div className="row-between">
              <span className="small">Tersedia untuk dipesan</span>
              <IonToggle
                checked={form.available}
                onIonChange={(event) => setForm({ ...form, available: event.detail.checked })}
              />
            </div>

            <div>
              <div className="section-kicker" style={{ marginBottom: 8 }}>
                Pratinjau kartu
              </div>
              <MenuCard item={{ ...form, id: form.id || 'preview' }} compact />
            </div>

            <IonButton expand="block" size="large" onClick={save}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Menu'}
            </IonButton>
          </div>
        </div>
      </IonModal>
    </StaffShell>
  );
};

export default AdminMenu;
