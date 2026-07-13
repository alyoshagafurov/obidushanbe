import { OrderDto } from '@obi/shared';
import { StatusBadge } from './ui';
import { money, dateTime } from '../lib/format';

export function OrderCard({
  order,
  onClick,
  showDistance,
  footer,
}: {
  order: OrderDto;
  onClick?: () => void;
  showDistance?: boolean;
  footer?: React.ReactNode;
}) {
  const items = order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ');
  const addr = order.address.text || (order.address.point ? 'Точка на карте' : '—');
  return (
    <div className="ordercard" onClick={onClick}>
      <div className="ordercard__top">
        <span className="ordercard__total">{money(order.total)}</span>
        <StatusBadge status={order.status} />
      </div>
      <div style={{ marginTop: 6 }}>{items}</div>
      <div className="hairline-muted" style={{ marginTop: 6, fontSize: 14 }}>📍 {addr}</div>
      {order.address.landmark && (
        <div className="hairline-muted" style={{ fontSize: 14, fontStyle: 'italic' }}>💬 {order.address.landmark}</div>
      )}
      <div className="row-between" style={{ marginTop: 8 }}>
        <span className="hairline-muted" style={{ fontSize: 13 }}>{dateTime(order.createdAt)}</span>
        {showDistance && order.distanceKm != null && (
          <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>~{order.distanceKm} км</span>
        )}
      </div>
      {footer && <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>{footer}</div>}
    </div>
  );
}
