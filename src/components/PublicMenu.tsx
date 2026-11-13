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
  cafeOutline,
  cartOutline,
  homeOutline,
  imagesOutline,
  informationCircleOutline,
  logInOutline,
  mailOutline,
  restaurantOutline,
  storefrontOutline,
} from 'ionicons/icons';
import React from 'react';

const LINKS = [
  { href: '/', label: 'Beranda', icon: homeOutline },
  { href: '/about', label: 'Tentang', icon: informationCircleOutline },
  { href: '/menu', label: 'Menu', icon: restaurantOutline },
  { href: '/gallery', label: 'Galeri', icon: imagesOutline },
  { href: '/contact', label: 'Kontak', icon: mailOutline },
];

export const PublicMenu: React.FC = () => {
  const router = useIonRouter();
  const close = async () => {
    await menuController.close('public-menu');
  };
  const go = (path: string) => {
    router.push(path);
    void close();
  };

  return (
    <IonMenu menuId="public-menu" contentId="main" type="overlay">
      <IonContent>
        <div style={{ padding: '22px 20px 10px' }}>
          <div className="row">
            <span className="brand-mark">☕</span>
            <div>
              <div className="brand-name">Ngoffe ID</div>
              <div className="brand-tag">Café &amp; Hotel</div>
            </div>
          </div>
          <IonNote style={{ display: 'block', marginTop: 10, fontSize: '.78rem' }}>
            Kopi hangat, makanan rumahan, dan pelayanan langsung ke kamar.
          </IonNote>
        </div>

        <IonList lines="none">
          {LINKS.map((link) => (
            <IonItem key={link.href} button onClick={() => go(link.href)} detail={false}>
              <IonIcon slot="start" icon={link.icon} color="primary" />
              <IonLabel>{link.label}</IonLabel>
            </IonItem>
          ))}
        </IonList>

        <div style={{ padding: '12px 18px' }}>
          <IonButton expand="block" onClick={() => go('/order')}>
            <IonIcon slot="start" icon={cartOutline} />
            Pesan dari Kamar
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => go('/order/status')}>
            <IonIcon slot="start" icon={bedOutline} />
            Lacak Pesanan
          </IonButton>
          <IonButton expand="block" fill="clear" onClick={() => go('/staff')}>
            <IonIcon slot="start" icon={logInOutline} />
            Dashboard Staf
          </IonButton>
        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <div className="divider" />
          <div className="row small muted">
            <IonIcon icon={storefrontOutline} />
            <span>Buka setiap hari, 07.00 – 22.00 WIB</span>
          </div>
          <div className="row small muted" style={{ marginTop: 8 }}>
            <IonIcon icon={cafeOutline} />
            <span>QRIS &amp; Cash</span>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );
};
