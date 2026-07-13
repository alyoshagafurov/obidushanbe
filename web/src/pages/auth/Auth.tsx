import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PHONE_REGEX, SMS_CODE_LENGTH, UserRole } from '@obi/shared';
import { requestCode, verifyCode, completeRegistration } from '../../api';
import { apiError } from '../../lib/api';
import { useAuth } from '../../store/auth';

const ROLES: { value: UserRole; icon: string; label: string }[] = [
  { value: UserRole.CLIENT, icon: '🛒', label: 'Клиент' },
  { value: UserRole.COURIER, icon: '🚚', label: 'Доставщик' },
  { value: UserRole.OPERATOR, icon: '🎧', label: 'Оператор' },
  { value: UserRole.CASHIER, icon: '🧮', label: 'Кассир' },
  { value: UserRole.ADMIN, icon: '👑', label: 'Админ' },
];
const PENDING = [UserRole.COURIER, UserRole.OPERATOR, UserRole.CASHIER];

export function Auth() {
  const nav = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState<'phone' | 'code' | 'register'>('phone');
  const [phone, setPhone] = useState('+992');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submitPhone = async () => {
    const p = phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(p)) return setErr('Введите номер в формате +992XXXXXXXXX');
    setErr(''); setLoading(true);
    try {
      const res = await requestCode(p);
      setDevCode(res.devCode);
      if (res.devCode) setCode(res.devCode);
      setStep('code');
    } catch (e) { setErr(apiError(e)); } finally { setLoading(false); }
  };

  const submitCode = async () => {
    setErr(''); setLoading(true);
    try {
      const res = await verifyCode(phone.replace(/\s/g, ''), code);
      signIn({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      if (res.isNewUser || !res.user.name) setStep('register');
      else nav('/app');
    } catch (e) { setErr(apiError(e)); } finally { setLoading(false); }
  };

  const submitRegister = async () => {
    if (!name.trim()) return;
    setErr(''); setLoading(true);
    try {
      const user = await completeRegistration({
        name: name.trim(), role,
        adminCode: role === UserRole.ADMIN ? adminCode.trim() : undefined,
      });
      setUser(user);
      nav('/app');
    } catch (e) { setErr(apiError(e)); } finally { setLoading(false); }
  };

  return (
    <div className="auth">
      <Link to="/" className="auth__back">← На главную</Link>
      <div className="auth__card">
        <div className="auth__brand">
          <img src="/logo.png" alt="ОБИ ДУШАНБЕ" />
        </div>

        {step === 'phone' && (
          <>
            <h1 className="auth__title">Вход</h1>
            <p className="muted auth__sub">Введите номер — пришлём код в SMS</p>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+992 XX XXX XX XX" inputMode="tel" onKeyDown={(e) => e.key === 'Enter' && submitPhone()} />
            {err && <div className="auth__err">{err}</div>}
            <button className="btn btn--block" style={{ marginTop: 14 }} disabled={loading} onClick={submitPhone}>
              Получить код
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <h1 className="auth__title">Код из SMS</h1>
            <p className="muted auth__sub">Отправлен на {phone}</p>
            {devCode && <div className="auth__dev">Dev-режим: код {devCode}</div>}
            <input className="input auth__code" value={code} maxLength={SMS_CODE_LENGTH}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, SMS_CODE_LENGTH))}
              placeholder="0000" inputMode="numeric" onKeyDown={(e) => e.key === 'Enter' && submitCode()} />
            {err && <div className="auth__err">{err}</div>}
            <button className="btn btn--block" style={{ marginTop: 14 }} disabled={loading || code.length !== SMS_CODE_LENGTH} onClick={submitCode}>
              Войти
            </button>
            <button className="btn btn--ghost btn--block" style={{ marginTop: 10 }} onClick={() => setStep('phone')}>
              Изменить номер
            </button>
          </>
        )}

        {step === 'register' && (
          <>
            <h1 className="auth__title">Регистрация</h1>
            <p className="muted auth__sub">Как вас зовут и кто вы?</p>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
            <div className="auth__roles">
              {ROLES.map((r) => (
                <button key={r.value} className={`auth__role ${role === r.value ? 'auth__role--on' : ''}`} onClick={() => setRole(r.value)}>
                  <span>{r.icon}</span>{r.label}
                </button>
              ))}
            </div>
            {role === UserRole.ADMIN && (
              <input className="input" style={{ marginTop: 12 }} value={adminCode} type="password"
                onChange={(e) => setAdminCode(e.target.value)} placeholder="Код администратора" />
            )}
            {PENDING.includes(role) && (
              <div className="auth__note">⏳ Аккаунт активируется после подтверждения администратором.</div>
            )}
            {err && <div className="auth__err">{err}</div>}
            <button className="btn btn--block" style={{ marginTop: 14 }}
              disabled={loading || !name.trim() || (role === UserRole.ADMIN && !adminCode.trim())} onClick={submitRegister}>
              Зарегистрироваться
            </button>
          </>
        )}
      </div>
    </div>
  );
}
