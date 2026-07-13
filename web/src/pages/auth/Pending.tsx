import { useAuth } from '../../store/auth';

export function Pending() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const bootstrap = useAuth((s) => s.bootstrap);
  return (
    <div className="center-screen" style={{ background: 'var(--grad-hero)' }}>
      <div className="auth__card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>⏳</div>
        <h1 className="auth__title">Аккаунт на проверке</h1>
        <p className="muted auth__sub">
          Ваш аккаунт ({user ? user.role : ''}) зарегистрирован и ожидает подтверждения администратором.
        </p>
        <button className="btn btn--block" onClick={() => bootstrap()}>Обновить</button>
        <button className="btn btn--ghost btn--block" style={{ marginTop: 10 }} onClick={signOut}>Выйти</button>
      </div>
    </div>
  );
}
