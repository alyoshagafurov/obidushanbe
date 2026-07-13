import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourierOrders } from '../../api';
import { apiError } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { OrderCard } from '../../components/OrderCard';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function Mine() {
  const nav = useNavigate();
  const [active, setActive] = useState(true);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['courier-orders', active], queryFn: () => getCourierOrders(active) });
  useOrdersRealtime([['courier-orders'], ['courier-orders', active]]);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  return (
    <>
      <div className="page__head">
        <h1>Мои заказы</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`chip ${active ? 'chip--active' : ''}`} onClick={() => setActive(true)}>Текущие</button>
          <button className={`chip ${!active ? 'chip--active' : ''}`} onClick={() => setActive(false)}>История</button>
        </div>
      </div>
      {!data?.length ? <Empty text="Заказов нет" icon="📦" /> : (
        <div style={{ maxWidth: 720 }}>{data.map((o) => <OrderCard key={o.id} order={o} onClick={() => nav(`/app/orders/${o.id}`)} />)}</div>
      )}
    </>
  );
}
