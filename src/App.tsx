import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import React, { Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';

import DeepLinkBridge from './components/DeepLinkBridge';
import { PublicMenu } from './components/PublicMenu';
import { PageSkeleton } from './components/Skeleton';
import { StaffMenu } from './components/StaffMenu';
import Cart from './pages/guest/Cart';
import OrderMenu from './pages/guest/OrderMenu';
import GuestOrderStatus from './pages/guest/OrderStatusPage';
import Scan from './pages/guest/Scan';
import KasirOrders from './pages/kasir/KasirOrders';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Gallery from './pages/public/Gallery';
import PublicHome from './pages/public/Home';
import MenuPage from './pages/public/MenuPage';
import Login from './pages/staff/Login';
import { AppProvider, useApp } from './store/AppStore';
import type { Role } from './types';
import { roleHome } from './utils/format';
import { setupNativeShell } from './utils/native';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Tema Ngoffe ID */
import './theme/variables.css';
import './theme/app.css';

/*
 * Halaman staf dan admin dimuat terpisah (code splitting). Selain memperkecil
 * bundle awal, fallback Suspense memberi kerangka skeleton yang terlihat wajar
 * di perangkat lambat maupun saat koneksi lambat pada versi web.
 */
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMenu = React.lazy(() => import('./pages/admin/AdminMenu'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminRooms = React.lazy(() => import('./pages/admin/AdminRooms'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminStaff = React.lazy(() => import('./pages/admin/AdminStaff'));
const AdminStock = React.lazy(() => import('./pages/admin/AdminStock'));
const Kitchen = React.lazy(() => import('./pages/kitchen/Kitchen'));
const KasirOrderDetail = React.lazy(() => import('./pages/kasir/KasirOrderDetail'));
const KasirShift = React.lazy(() => import('./pages/kasir/KasirShift'));
const KasirTransactions = React.lazy(() => import('./pages/kasir/KasirTransactions'));
const Payment = React.lazy(() => import('./pages/guest/Payment'));

const Loading: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

setupIonicReact();

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
}

const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const { state } = useApp();
  const session = state.session;

  if (!session) return <Navigate to="/staff" replace />;
  if (!roles.includes(session.role)) return <Navigate to={roleHome[session.role]} replace />;

  return <>{children}</>;
};

const Routes: React.FC = () => (
  <IonReactRouter>
    <DeepLinkBridge />
    <IonRouterOutlet id="main">
      {/* ===== Website publik ===== */}
      <Route path="/" element={<PublicHome />} />
      <Route path="/about" element={<About />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/contact" element={<Contact />} />

      {/* ===== Pemesanan tamu via QR kamar ===== */}
      <Route path="/order" element={<Scan />} />
      <Route path="/order/menu" element={<OrderMenu />} />
      <Route path="/order/cart" element={<Cart />} />
      <Route
        path="/order/payment/:id"
        element={
          <Loading>
            <Payment />
          </Loading>
        }
      />
      <Route path="/order/status" element={<GuestOrderStatus />} />
      <Route path="/order/status/:id" element={<GuestOrderStatus />} />

      {/* ===== Login staf (tanpa menu) ===== */}
      <Route path="/staff" element={<Login />} />

      {/* ===== Kasir ===== */}
      <Route
        path="/staff/kasir"
        element={
          <RequireRole roles={['kasir', 'admin']}>
            <KasirOrders />
          </RequireRole>
        }
      />
      <Route
        path="/staff/kasir/transactions"
        element={
          <RequireRole roles={['kasir', 'admin']}>
            <Loading>
              <KasirTransactions />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/staff/kasir/shift"
        element={
          <RequireRole roles={['kasir', 'admin']}>
            <Loading>
              <KasirShift />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/staff/kasir/order/:id"
        element={
          <RequireRole roles={['kasir', 'admin']}>
            <Loading>
              <KasirOrderDetail />
            </Loading>
          </RequireRole>
        }
      />

      {/* ===== Kitchen ===== */}
      <Route
        path="/staff/kitchen"
        element={
          <RequireRole roles={['kitchen', 'admin']}>
            <Loading>
              <Kitchen />
            </Loading>
          </RequireRole>
        }
      />

      {/* ===== Admin ===== */}
      <Route
        path="/admin"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminDashboard />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminMenu />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/rooms"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminRooms />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminStaff />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/stock"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminStock />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminReports />
            </Loading>
          </RequireRole>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RequireRole roles={['admin']}>
            <Loading>
              <AdminSettings />
            </Loading>
          </RequireRole>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </IonRouterOutlet>

    {/* Menu global, menempel ke outlet agar selalu menemukan elemen konten */}
    <PublicMenu />
    <StaffMenu />
  </IonReactRouter>
);

/** Memasang perilaku native (status bar, tombol back Android) sekali saat aplikasi dimuat. */
const NativeShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  React.useEffect(() => setupNativeShell(), []);
  return <>{children}</>;
};

const App: React.FC = () => (
  <IonApp>
    <AppProvider>
      <NativeShell>
        <Routes />
      </NativeShell>
    </AppProvider>
  </IonApp>
);

export default App;
