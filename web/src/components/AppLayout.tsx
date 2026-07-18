import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '@obi/shared';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';

type NavItem = { to: string; label: string; icon: string };

const NAV: Record<string, NavItem[]> = {
  CLIENT: [
    { to: '/app', label: 'Каталог', icon: '💧' },
    { to: '/app/cart', label: 'Корзина', icon: '🛒' },
    { to: '/app/orders', label: 'Заказы', icon: '📦' },
  ],
  COURIER: [
    { to: '/app', label: 'Новые', icon: '📋' },
    { to: '/app/mine', label: 'Мои', icon: '🚚' },
    { to: '/app/map', label: 'Карта', icon: '🗺️' },
    { to: '/app/earnings', label: 'Заработок', icon: '💰' },
  ],
  OPERATOR: [
    { to: '/app', label: 'Новый', icon: '➕' },
    { to: '/app/orders', label: 'Заказы', icon: '📦' },
  ],
  CASHIER: [
    { to: '/app', label: 'Отчёт', icon: '📝' },
    { to: '/app/balances', label: 'Копилка', icon: '💰' },
    { to: '/app/rates', label: 'Ставки', icon: '⚙️' },
  ],
  ADMIN: [
    { to: '/app', label: 'Дашборд', icon: '📊' },
    { to: '/app/products', label: 'Товары', icon: '💧' },
    { to: '/app/staff', label: 'Люди', icon: '👥' },
    { to: '/app/orders', label: 'Заказы', icon: '📦' },
    { to: '/app/reviews', label: 'Отзывы', icon: '⭐' },
  ],
};

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const cartCount = useCart((s) => s.count());
  const links = user ? NAV[user.role] ?? [] : [];
  const isClient = user?.role === UserRole.CLIENT;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar__in">
          <NavLink to="/app" end className="topbar__brand">
            <img src="/logo.png" alt="" />
            <span className="topbar__brandtext">ОБИ ДУШАНБЕ</span>
          </NavLink>
          {/* Десктоп-навигация (на мобиле скрыта — там нижняя панель) */}
          <nav className="topbar__nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/app'}
                className={({ isActive }) => `topbar__link ${isActive ? 'topbar__link--on' : ''}`}
              >
                {l.label}
                {isClient && l.to === '/app/cart' && cartCount > 0 && (
                  <span className="topbar__cartbadge">{cartCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="topbar__spacer" />
          <span className="topbar__user muted">{user?.name}</span>
          <button className="btn btn--ghost btn--sm topbar__signout" onClick={signOut}>Выйти</button>
        </div>
      </header>

      <main className="page">
        <div className="container">{children}</div>
      </main>

      {/* Нижняя навигация — только на мобиле */}
      <nav className="bottomnav" aria-label="Навигация">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/app'}
            className={({ isActive }) => `bottomnav__item ${isActive ? 'bottomnav__item--on' : ''}`}
          >
            <span className="bottomnav__icon" aria-hidden>
              {l.icon}
              {isClient && l.to === '/app/cart' && cartCount > 0 && (
                <span className="bottomnav__badge">{cartCount}</span>
              )}
            </span>
            <span className="bottomnav__label">{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
