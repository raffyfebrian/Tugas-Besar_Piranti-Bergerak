import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { logOutOutline, storefrontOutline } from 'ionicons/icons';
import React from 'react';

import { useApp } from '../store/AppStore';
import { roleLabel } from '../utils/format';

interface StaffShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const StaffShell: React.FC<StaffShellProps> = ({ title, subtitle, actions, children }) => {
  const { state, logout } = useApp();
  const router = useIonRouter();
  const role = state.session?.role ?? 'kasir';

  const handleLogout = () => {
    logout();
    router.push('/staff');
  };

  return (
    <IonPage>
      <IonHeader className="staff-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton menu="staff-menu" />
          </IonButtons>
          <IonTitle>
            <div className="row" style={{ gap: 8 }}>
              <span className="brand-mark">☕</span>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: '.84rem', fontWeight: 800 }}>{state.settings.cafeName}</div>
                <div
                  style={{
                    fontSize: '.66rem',
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: 'var(--ngoffe-accent)',
                  }}
                >
                  {roleLabel[role]} Workspace
                </div>
              </div>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" routerLink="/" aria-label="Lihat situs publik">
              <IonIcon slot="icon-only" icon={storefrontOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={handleLogout} aria-label="Keluar">
              <IonIcon slot="icon-only" icon={logOutOutline} color="danger" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent id="staff-content">
        <div className="container" style={{ padding: '20px 0 48px' }}>
          <div className="row-between wrap" style={{ marginBottom: 18, alignItems: 'flex-start' }}>
            <div>
              <h1 className="staff-page-title">{title}</h1>
              {subtitle && <p className="staff-page-sub">{subtitle}</p>}
            </div>
            {actions && <div className="row wrap">{actions}</div>}
          </div>
          {children}
        </div>
      </IonContent>
    </IonPage>
  );
};
