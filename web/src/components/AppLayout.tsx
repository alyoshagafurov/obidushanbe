import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '@obi/shared';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';

const NAV: Record<string, { to: string; label: string }[]> = {
  CLIENT: [
    { to: '/app', label: 'Каталог' },
    { to: '/app/cart', label: 'Корзина' },
    { to: '/app/orders', label: 'Мои заказы' },
  ],
  COURIER: [
    { to: '/app', label: 'Новые заказы' },
    { to: '/app/mine', label: 'Мои заказы' },
    { to: '/app/map', label: 'Карта' },
  ],
  OPERATOR: [
    { to: '/app', label: 'Новый заказ' },
    { to: '/app/orders', label: 'Мои заказы' },
  ],
  CASHIER: [
    { to: '/app', label: 'За день' },
    { to: '/app/warehouse', label: 'Склад' },
    { to: '/app/balances', label: 'Копилка' },
    { to: '/app/rates', label: 'Ставки' },
  ],
  ADMIN: [
    { to: '/app', label: 'Дашборд' },
    { to: '/app/products', label: 'Товары' },
    { to: '/app/staff', label: 'Сотрудники' },
    { to: '/app/orders', label: 'Заказы' },
    { to: '/app/reviews', label: 'Отзывы' },
  ],
};

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const cartCount = useCart((s) => s.count());
  const links = user ? NAV[user.role] ?? [] : [];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__in">
          <NavLink to="/app" end className="topbar__brand">
            <img src="/logo.png" alt="" />
            <span>ОБИ ДУШАНБЕ</span>
          </NavLink>
          <nav className="topbar__nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/app'}
                className={({ isActive }) => `topbar__link ${isActive ? 'topbar__link--on' : ''}`}
              >
                {l.label}
                {user?.role === UserRole.CLIENT && l.to === '/app/cart' && cartCount > 0 && (
                  <span className="topbar__cartbadge">{cartCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="topbar__spacer" />
          <span className="muted" style={{ fontWeight: 700 }}>{user?.name}</span>
          <button className="btn btn--ghost btn--sm" onClick={signOut}>Выйти</button>
        </div>
      </header>
      <main className="page">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
