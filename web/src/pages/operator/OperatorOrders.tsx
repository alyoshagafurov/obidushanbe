import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOperatorOrders } from '../../api';
import { apiError } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { OrderCard } from '../../components/OrderCard';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function OperatorOrders() {
  const nav = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['operator-orders'], queryFn: getOperatorOrders });
  useOrdersRealtime([['operator-orders']]);
  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;
  return (
    <>
      <div className="page__head"><h1>Мои заказы</h1></div>
      {!data?.length ? <Empty text="Заказов нет" icon="📦" /> : (
        <div style={{ maxWidth: 720 }}>{data.map((o) => <OrderCard key={o.id} order={o} onClick={() => nav(`/app/orders/${o.id}`)} />)}</div>
      )}
    </>
  );
}
