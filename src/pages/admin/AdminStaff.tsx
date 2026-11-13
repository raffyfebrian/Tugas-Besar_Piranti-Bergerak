import {
  IonButton,
  IonIcon,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonToggle,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, pencilOutline, personAddOutline, trashOutline } from 'ionicons/icons';
import React, { useState } from 'react';

import { StaffShell } from '../../components/StaffShell';
import { useApp } from '../../store/AppStore';
import type { Role, StaffMember } from '../../types';
import { roleLabel } from '../../utils/format';

const ROLES: Role[] = ['kasir', 'kitchen', 'admin'];

const emptyStaff = (): StaffMember => ({
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'kasir',
  active: true,
});

const AdminStaff: React.FC = () => {
  const { state, saveStaff, deleteStaff } = useApp();
  const [present] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StaffMember>(emptyStaff());
  const [isEdit, setIsEdit] = useState(false);

  const openNew = () => {
    setForm(emptyStaff());
    setIsEdit(false);
    setOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setForm(member);
    setIsEdit(true);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      void present({
        message: 'Nama, email, dan password wajib diisi.',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    const email = form.email.trim().toLowerCase();
    const duplicate = state.staff.some((member) => member.email.toLowerCase() === email && member.id !== form.id);
    if (duplicate) {
      void present({ message: 'Email sudah dipakai staf lain.', duration: 2000, color: 'danger', position: 'top' });
      return;
    }
    saveStaff({
      ...form,
      id: form.id || `staff-${Date.now().toString(36)}`,
      name: form.name.trim(),
      email,
      password: form.password.trim(),
    });
    setOpen(false);
    void present({
      message: isEdit ? 'Data staf diperbarui.' : 'Staf baru ditambahkan.',
      duration: 1700,
      color: 'success',
      position: 'top',
    });
  };

  const toggleActive = (member: StaffMember) => {
    if (member.id === state.session?.staffId && member.active) {
      void present({
        message: 'Tidak bisa menonaktifkan akun yang sedang digunakan.',
        duration: 2200,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    saveStaff({ ...member, active: !member.active });
  };

  const confirmDelete = (member: StaffMember) => {
    if (member.id === state.session?.staffId) {
      void present({
        message: 'Anda tidak bisa menghapus akun sendiri.',
        duration: 2200,
        color: 'warning',
        position: 'top',
      });
      return;
    }
    void presentAlert({
      header: 'Hapus staf?',
      message: `${member.name} tidak akan bisa masuk lagi ke workspace.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            deleteStaff(member.id);
            void present({ message: 'Staf dihapus.', duration: 1500, color: 'medium', position: 'top' });
          },
        },
      ],
    });
  };

  return (
    <StaffShell
      title="Staf & Hak Akses"
      subtitle="Kelola akun kasir, kitchen, dan admin yang dapat masuk ke workspace."
      actions={
        <IonButton size="small" onClick={openNew}>
          <IonIcon slot="start" icon={personAddOutline} />
          Tambah Staf
        </IonButton>
      }
    >
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        {ROLES.map((role) => (
          <div className="kpi-card" key={role}>
            <div className="kpi-icon">{role === 'kasir' ? '💳' : role === 'kitchen' ? '🍳' : '🛡️'}</div>
            <div className="kpi-label">{roleLabel[role]}</div>
            <div className="kpi-value">{state.staff.filter((member) => member.role === role).length}</div>
            <div className="kpi-note">
              {state.staff.filter((member) => member.role === role && member.active).length} aktif
            </div>
          </div>
        ))}
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Total Aktif</div>
          <div className="kpi-value">{state.staff.filter((member) => member.active).length}</div>
          <div className="kpi-note">Dari {state.staff.length} akun</div>
        </div>
      </div>

      <div className="panel">
        <div className="row-between">
          <div>
            <h3 className="panel-title">Daftar staf</h3>
            <p className="panel-sub">Nonaktifkan akun tanpa menghapus riwayatnya.</p>
          </div>
          <IonButton size="small" fill="outline" onClick={openNew}>
            <IonIcon slot="start" icon={addOutline} />
            Baru
          </IonButton>
        </div>

        {state.staff.map((member) => (
          <div className="manage-row" key={member.id}>
            <div
              className="manage-thumb"
              style={{
                background: member.role === 'admin' ? '#e2ebe5' : member.role === 'kitchen' ? '#ddefe3' : '#d9efe6',
                fontWeight: 800,
                fontSize: '.95rem',
              }}
            >
              {member.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="grow">
              <div className="row-between wrap">
                <div>
                  <strong className="small">
                    {member.name}
                    {member.id === state.session?.staffId && (
                      <span className="badge-soft" style={{ marginLeft: 6 }}>
                        Anda
                      </span>
                    )}
                  </strong>
                  <div className="muted small">
                    {member.email} • {roleLabel[member.role]}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <span className={`badge-soft ${member.active ? 'success' : 'danger'}`}>
                    {member.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <IonToggle
                    checked={member.active}
                    onIonChange={() => toggleActive(member)}
                    style={{ transform: 'scale(.8)' }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => openEdit(member)}
                    aria-label={`Edit ${member.name}`}
                  >
                    <IonIcon icon={pencilOutline} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => confirmDelete(member)}
                    aria-label={`Hapus ${member.name}`}
                  >
                    <IonIcon icon={trashOutline} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16, background: '#eaf3ed', borderStyle: 'dashed' }}>
        <strong className="small">Akun demo</strong>
        <p className="muted small" style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
          Kasir: kasir@ngoffe.id / kasir123 • Kitchen: kitchen@ngoffe.id / kitchen123 • Admin: admin@ngoffe.id /
          admin123. Password disimpan apa adanya di localStorage karena ini prototipe; di produksi gunakan hashing di
          backend.
        </p>
      </div>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <div className="ion-padding" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="row-between">
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Staf' : 'Tambah Staf'}
              </h2>
              <p className="panel-sub">Akun langsung bisa dipakai untuk masuk.</p>
            </div>
            <IonButton fill="clear" onClick={() => setOpen(false)}>
              Tutup
            </IonButton>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            <IonInput
              label="Nama lengkap"
              labelPlacement="stacked"
              fill="outline"
              value={form.name}
              onIonInput={(event) => setForm({ ...form, name: event.detail.value ?? '' })}
              placeholder="Nama staf"
            />
            <IonInput
              label="Email"
              labelPlacement="stacked"
              fill="outline"
              type="email"
              value={form.email}
              onIonInput={(event) => setForm({ ...form, email: event.detail.value ?? '' })}
              placeholder="nama@ngoffe.id"
            />
            <IonInput
              label="Password"
              labelPlacement="stacked"
              fill="outline"
              value={form.password}
              onIonInput={(event) => setForm({ ...form, password: event.detail.value ?? '' })}
              placeholder="Minimal 6 karakter"
            />
            <IonSelect
              label="Peran"
              labelPlacement="stacked"
              fill="outline"
              value={form.role}
              onIonChange={(event) => setForm({ ...form, role: event.detail.value as Role })}
            >
              {ROLES.map((role) => (
                <IonSelectOption key={role} value={role}>
                  {roleLabel[role]}
                </IonSelectOption>
              ))}
            </IonSelect>
            <div className="row-between">
              <span className="small">Akun aktif</span>
              <IonToggle
                checked={form.active}
                onIonChange={(event) => setForm({ ...form, active: event.detail.checked })}
              />
            </div>
            <IonButton expand="block" size="large" onClick={save}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Staf'}
            </IonButton>
          </div>
        </div>
      </IonModal>
    </StaffShell>
  );
};

export default AdminStaff;
