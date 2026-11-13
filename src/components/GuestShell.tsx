import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { arrowBackOutline, cartOutline, homeOutline } from 'ionicons/icons';
import React from 'react';

import { useApp } from '../store/AppStore';

interface GuestShellProps {
  title: string;
  backHref?: string;
  showCart?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const GuestShell: React.FC<GuestShellProps> = ({
  title,
  backHref = '/order',
  showCart = true,
  footer,
  children,
}) => {
  const { cartCount } = useApp();
  const router = useIonRouter();

  return (
    <IonPage>
      <IonHeader className="public-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => (backHref === '/order' ? router.push('/order') : router.push(backHref))}
              aria-label="Kembali"
            >
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" routerLink="/" aria-label="Beranda">
              <IonIcon slot="icon-only" icon={homeOutline} />
            </IonButton>
            {showCart && (
              <IonButton fill="clear" onClick={() => router.push('/order/cart')} aria-label="Keranjang">
                <IonIcon slot="icon-only" icon={cartOutline} />
                {cartCount > 0 && (
                  <IonBadge color="danger" className="cart-badge-pop" key={cartCount}>
                    {cartCount}
                  </IonBadge>
                )}
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent id="guest-content">
        <div className="narrow" style={{ padding: '14px 0 28px' }}>
          {children}
        </div>
      </IonContent>

      {footer && <IonFooter className="ion-no-border">{footer}</IonFooter>}
    </IonPage>
  );
};
