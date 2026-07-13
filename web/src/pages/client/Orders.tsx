import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ACTIVE_ORDER_STATUSES, OrderStatus } from '@obi/shared';
import { getMyOrders } from '../../api';
import { apiError } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { OrderCard } from '../../components/OrderCard';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function Orders() {
  const nav = useNavigate();
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['my-orders'], queryFn: getMyOrders });
  useOrdersRealtime([['my-orders']]);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  const list = (data ?? []).filter((o) =>
    tab === 'current' ? ACTIVE_ORDER_STATUSES.includes(o.status) : o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED,
  );

  return (
    <>
      <div className="page__head">
        <h1>Мои заказы</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`chip ${tab === 'current' ? 'chip--active' : ''}`} onClick={() => setTab('current')}>Текущие</button>
          <button className={`chip ${tab === 'history' ? 'chip--active' : ''}`} onClick={() => setTab('history')}>История</button>
        </div>
      </div>
      {!list.length ? (
        <Empty text="Заказов пока нет" icon="📦" />
      ) : (
        <div style={{ maxWidth: 720 }}>
          {list.map((o) => <OrderCard key={o.id} order={o} onClick={() => nav(`/app/orders/${o.id}`)} />)}
        </div>
      )}
    </>
  );
}
