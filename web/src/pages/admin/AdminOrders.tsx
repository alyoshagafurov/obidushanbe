import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus } from '@obi/shared';
import { getAdminOrders, getCouriers, reassignOrder } from '../../api';
import { apiError } from '../../lib/api';
import { OrderCard } from '../../components/OrderCard';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

const FILTERS: { v: string; l: string }[] = [
  { v: 'ALL', l: 'Все' }, { v: OrderStatus.NEW, l: 'Новые' }, { v: OrderStatus.ON_WAY, l: 'В пути' },
  { v: OrderStatus.DELIVERED, l: 'Доставлены' }, { v: OrderStatus.CANCELLED, l: 'Отменены' },
];

export function AdminOrders() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState('ALL');
  const [reassignId, setReassignId] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin-orders', status], queryFn: () => getAdminOrders(status === 'ALL' ? {} : { status }) });
  const couriers = useQuery({ queryKey: ['staff', 'COURIER'], queryFn: getCouriers });

  const reassign = useMutation({
    mutationFn: (v: { orderId: string; courierId: string | null }) => reassignOrder(v.orderId, v.courierId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setReassignId(null); }, onError: (e) => alert(apiError(e)),
  });

  return (
    <>
      <div className="page__head"><h1>Все заказы</h1></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => <button key={f.v} className={`chip ${status === f.v ? 'chip--active' : ''}`} onClick={() => setStatus(f.v)}>{f.l}</button>)}
      </div>
      {isLoading ? <Spinner /> : isError ? <ErrorBox message={apiError(error)} onRetry={refetch} /> :
        !data?.length ? <Empty text="Заказов нет" icon="📦" /> : (
          <div style={{ maxWidth: 720 }}>
            {data.map((o) => (
              <OrderCard key={o.id} order={o} onClick={() => nav(`/app/orders/${o.id}`)}
                footer={
                  <div className="row-between">
                    <span className="hairline-muted">{o.courier ? `🚚 ${o.courier.name}` : 'Без доставщика'}</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setReassignId(o.id)}>Переназначить</button>
                  </div>
                } />
            ))}
          </div>
        )}

      {reassignId && (
        <div className="modal-bg" onClick={() => setReassignId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Переназначить заказ</h3>
            <div className="stack" style={{ marginTop: 12 }}>
              <button className="btn btn--ghost btn--block" onClick={() => reassign.mutate({ orderId: reassignId, courierId: null })}>✕ Снять назначение</button>
              {(couriers.data ?? []).filter((c) => c.isActive).map((c) => (
                <button key={c.id} className="btn btn--light btn--block" onClick={() => reassign.mutate({ orderId: reassignId, courierId: c.id })}>🚚 {c.name} (★ {c.rating.toFixed(1)})</button>
              ))}
            </div>
            <button className="btn btn--ghost btn--block" style={{ marginTop: 12 }} onClick={() => setReassignId(null)}>Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
