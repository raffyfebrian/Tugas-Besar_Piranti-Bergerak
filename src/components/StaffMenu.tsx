import { menuController } from '@ionic/core/components';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonNote,
  useIonRouter,
} from '@ionic/react';
import {
  bedOutline,
  cubeOutline,
  flameOutline,
  gridOutline,
  logOutOutline,
  peopleOutline,
  receiptOutline,
  restaurantOutline,
  settingsOutline,
  statsChartOutline,
  storefrontOutline,
  walletOutline,
} from 'ionicons/icons';
import React from 'react';

import { useApp } from '../store/AppStore';
import { roleLabel } from '../utils/format';

const LINKS: Record<string, { href: string; label: string; icon: string }[]> = {
  kasir: [
    { href: '/staff/kasir', label: 'Pesanan Masuk', icon: receiptOutline },
    { href: '/staff/kasir/transactions', label: 'Transaksi Harian', icon: walletOutline },
  ],
  kitchen: [
    { href: '/staff/kitchen', label: 'Antrean Dapur', icon: flameOutline },
    { href: '/staff/kitchen#stok', label: 'Stok Bahan Baku', icon: cubeOutline },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: gridOutline },
    { href: '/admin/menu', label: 'Menu & Kategori', icon: restaurantOutline },
    { href: '/admin/rooms', label: 'Kamar & QR', icon: bedOutline },
    { href: '/admin/staff', label: 'Staf & Akses', icon: peopleOutline },
    { href: '/admin/stock', label: 'Stok & Resep', icon: cubeOutline },
    { href: '/admin/reports', label: 'Laporan', icon: statsChartOutline },
    { href: '/admin/settings', label: 'Pengaturan', icon: settingsOutline },
  ],
};

export const StaffMenu: React.FC = () => {
  const { state, logout } = useApp();
  const router = useIonRouter();
  const session = state.session;

  if (!session) return null;

  const go = (path: string) => {
    router.push(path);
    void menuController.close('staff-menu');
  };

  const handleLogout = () => {
    logout();
    void menuController.close('staff-menu');
    router.push('/staff');
  };

  return (
    <IonMenu menuId="staff-menu" contentId="main" type="overlay">
      <IonContent>
        <div style={{ padding: '22px 20px 10px' }}>
          <div className="row">
            <span className="brand-mark">☕</span>
            <div>
              <div className="brand-name">{state.settings.cafeName}</div>
              <div className="brand-tag">{roleLabel[session.role]} Workspace</div>
            </div>
          </div>
          <div className="pill" style={{ marginTop: 14 }}>
            {session.name}
          </div>
        </div>

        <IonList lines="none">
          {(LINKS[session.role] ?? []).map((link) => (
            <IonItem key={link.href} button onClick={() => go(link.href)} detail={false}>
              <IonIcon slot="start" icon={link.icon} color="primary" />
              <IonLabel>{link.label}</IonLabel>
            </IonItem>
          ))}
        </IonList>

        <div className="divider" style={{ margin: '10px 20px' }} />

        <IonList lines="none">
          <IonItem button onClick={() => go('/')} detail={false}>
            <IonIcon slot="start" icon={storefrontOutline} color="medium" />
            <IonLabel>Lihat Situs Publik</IonLabel>
          </IonItem>
          <IonItem button onClick={handleLogout} detail={false}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Keluar</IonLabel>
          </IonItem>
        </IonList>

        <div style={{ padding: '8px 20px 24px' }}>
          <IonNote style={{ fontSize: '.72rem' }}>
            Data demo tersimpan di localStorage browser. Login demo: admin@ngoffe.id / admin123.
          </IonNote>
        </div>

        <div style={{ padding: '0 18px 24px' }}>
          <IonButton expand="block" fill="outline" onClick={() => go('/staff')}>
            Ganti Akun
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>
  );
};
