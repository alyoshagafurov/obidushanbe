import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from '@obi/shared';
import { useAuth } from './store/auth';
import { setAuthFailureHandler } from './lib/api';
import { connectSocket, disconnectSocket } from './lib/socket';
import { AppLayout } from './components/AppLayout';
import { Spinner } from './components/ui';

import { Landing } from './pages/Landing';
import { Auth } from './pages/auth/Auth';
import { Pending } from './pages/auth/Pending';
import { OrderDetail } from './pages/shared/OrderDetail';
import { Chat } from './pages/shared/Chat';

import { Catalog } from './pages/client/Catalog';
import { Cart } from './pages/client/Cart';
import { Checkout } from './pages/client/Checkout';
import { Orders } from './pages/client/Orders';

import { Feed } from './pages/courier/Feed';
import { Mine } from './pages/courier/Mine';
import { CourierMap } from './pages/courier/CourierMap';
import { Earnings } from './pages/courier/Earnings';

import { NewOrder } from './pages/operator/NewOrder';
import { OperatorOrders } from './pages/operator/OperatorOrders';

import { Report } from './pages/cashier/Report';
import { Balances } from './pages/cashier/Balances';
import { Rates } from './pages/cashier/Rates';

import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { Staff } from './pages/admin/Staff';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminReviews } from './pages/admin/AdminReviews';

function RoleRoutes({ role }: { role: UserRole }) {
  switch (role) {
    case UserRole.CLIENT:
      return (
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="chat/:peerId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      );
    case UserRole.COURIER:
      return (
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="mine" element={<Mine />} />
          <Route path="map" element={<CourierMap />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="chat/:peerId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      );
    case UserRole.OPERATOR:
      return (
        <Routes>
          <Route path="/" element={<NewOrder />} />
          <Route path="orders" element={<OperatorOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      );
    case UserRole.CASHIER:
      return (
        <Routes>
          <Route path="/" element={<Report />} />
          <Route path="balances" element={<Balances />} />
          <Route path="rates" element={<Rates />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      );
    case UserRole.ADMIN:
      return (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="staff" element={<Staff />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      );
    default:
      return <Navigate to="/login" replace />;
  }
}

function Protected() {
  const { status, user } = useAuth();
  if (status === 'loading') return <div className="center-screen"><div className="spin" /></div>;
  if (status === 'unauthenticated' || !user) return <Navigate to="/login" replace />;
  if (!user.name) return <Navigate to="/login" replace />;
  if ([UserRole.COURIER, UserRole.OPERATOR, UserRole.CASHIER].includes(user.role) && !user.isActive) return <Pending />;
  return (
    <AppLayout>
      <RoleRoutes role={user.role} />
    </AppLayout>
  );
}

function LoginRoute() {
  const { status, user } = useAuth();
  if (status === 'loading') return <div className="center-screen"><div className="spin" /></div>;
  if (status === 'authenticated' && user?.name) return <Navigate to="/app" replace />;
  return <Auth />;
}

export function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const signOut = useAuth((s) => s.signOut);
  const status = useAuth((s) => s.status);

  useEffect(() => {
    setAuthFailureHandler(() => signOut());
    void bootstrap();
  }, [bootstrap, signOut]);

  useEffect(() => {
    if (status === 'authenticated') connectSocket();
    else disconnectSocket();
  }, [status]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/app/*" element={<Protected />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
