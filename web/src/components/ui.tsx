import { OrderStatus } from '@obi/shared';

export function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: 48, gap: 12 }}>
      <div className="spin" />
      {label && <span className="muted">{label}</span>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
      <p style={{ marginBottom: 14 }}>{message ?? 'Что-то пошло не так'}</p>
      {onRetry && (
        <button className="btn btn--ghost btn--sm" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function Empty({ text, icon = '📭' }: { text?: string; icon?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <p className="hairline-muted">{text ?? 'Пусто'}</p>
    </div>
  );
}

const STATUS: Record<OrderStatus, { label: string; color: string }> = {
  NEW: { label: 'В обработке', color: 'var(--primary)' },
  TAKEN: { label: 'Принят', color: '#1f8ae0' },
  ACCEPTED: { label: 'Подтверждён', color: 'var(--warning)' },
  ON_WAY: { label: 'В пути', color: 'var(--primary)' },
  DELIVERED: { label: 'Доставлен', color: 'var(--success)' },
  CANCELLED: { label: 'Отменён', color: 'var(--danger)' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? { label: status, color: 'var(--muted)' };
  return (
    <span className="badge" style={{ background: `${s.color}1f`, color: s.color }}>
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

const AVA_COLORS = ['#0E72C9', '#1A9D58', '#E0A100', '#8E44AD', '#16A5A5', '#E4572E', '#2C82C9', '#C0392B'];
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

export function Avatar({ name, size = 40, url }: { name?: string | null; size?: number; url?: string | null }) {
  const initials = (name ?? '?').trim().slice(0, 1).toUpperCase();
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  const bg = AVA_COLORS[hashStr(name ?? 'x') % AVA_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.42, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', r = 8, style }: { h?: number; w?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid--products">
      {Array.from({ length: n }).map((_, i) => (
        <div className="card" key={i}><Skeleton h={130} r={12} /><Skeleton h={18} style={{ marginTop: 12 }} /><Skeleton h={14} w="60%" style={{ marginTop: 8 }} /></div>
      ))}
    </div>
  );
}

export function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={onChange ? () => onChange(i) : undefined}
          style={{
            fontSize: size,
            cursor: onChange ? 'pointer' : 'default',
            color: i <= Math.round(value) ? 'var(--star)' : 'var(--border)',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
