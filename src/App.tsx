import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import { PublicMenu } from './components/PublicMenu';
import { StaffMenu } from './components/StaffMenu';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminReports from './pages/admin/AdminReports';
import AdminRooms from './pages/admin/AdminRooms';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStaff from './pages/admin/AdminStaff';
import AdminStock from './pages/admin/AdminStock';
import Cart from './pages/guest/Cart';
import OrderMenu from './pages/guest/OrderMenu';
import GuestOrderStatus from './pages/guest/OrderStatusPage';
import Payment from './pages/guest/Payment';
import Scan from './pages/guest/Scan';
import KasirOrderDetail from './pages/kasir/KasirOrderDetail';
import KasirOrders from './pages/kasir/KasirOrders';
import KasirTransactions from './pages/kasir/KasirTransactions';
import Kitchen from './pages/kitchen/Kitchen';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Gallery from './pages/public/Gallery';
import PublicHome from './pages/public/Home';
import MenuPage from './pages/public/MenuPage';
import Login from './pages/staff/Login';
import { AppProvider, useApp } from './store/AppStore';
import type { Role } from './types';
import { roleHome } from './utils/format';

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
      <Route path="/order/payment/:id" element={<Payment />} />
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
            <KasirTransactions />
          </RequireRole>
        }
      />
      <Route
        path="/staff/kasir/order/:id"
        element={
          <RequireRole roles={['kasir', 'admin']}>
            <KasirOrderDetail />
          </RequireRole>
        }
      />

      {/* ===== Kitchen ===== */}
      <Route
        path="/staff/kitchen"
        element={
          <RequireRole roles={['kitchen', 'admin']}>
            <Kitchen />
          </RequireRole>
        }
      />

      {/* ===== Admin ===== */}
      <Route
        path="/admin"
        element={
          <RequireRole roles={['admin']}>
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <RequireRole roles={['admin']}>
            <AdminMenu />
          </RequireRole>
        }
      />
      <Route
        path="/admin/rooms"
        element={
          <RequireRole roles={['admin']}>
            <AdminRooms />
          </RequireRole>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <RequireRole roles={['admin']}>
            <AdminStaff />
          </RequireRole>
        }
      />
      <Route
        path="/admin/stock"
        element={
          <RequireRole roles={['admin']}>
            <AdminStock />
          </RequireRole>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RequireRole roles={['admin']}>
            <AdminReports />
          </RequireRole>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <RequireRole roles={['admin']}>
            <AdminSettings />
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

const App: React.FC = () => (
  <IonApp>
    <AppProvider>
      <Routes />
    </AppProvider>
  </IonApp>
);

export default App;
