import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed, takeOrder } from '../../api';
import { apiError } from '../../lib/api';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { OrderCard } from '../../components/OrderCard';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function Feed() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [loc, setLoc] = useState<{ lat: number; lng: number } | undefined>();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['feed', loc], queryFn: () => getFeed(loc) });
  useOrdersRealtime([['feed'], ['feed', loc]]);

  const take = useMutation({
    mutationFn: (id: string) => takeOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); qc.invalidateQueries({ queryKey: ['courier-orders'] }); },
    onError: (e) => alert(apiError(e)),
  });

  const detect = () => navigator.geolocation?.getCurrentPosition((p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }));

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  return (
    <>
      <div className="page__head">
        <h1>Новые заказы</h1>
        <button className="btn btn--ghost btn--sm" onClick={detect}>📍 Обновить местоположение</button>
      </div>
      {!data?.length ? <Empty text="Сейчас новых заказов нет" icon="🚚" /> : (
        <div style={{ maxWidth: 720 }}>
          {data.map((o) => (
            <OrderCard key={o.id} order={o} showDistance onClick={() => nav(`/app/orders/${o.id}`)}
              footer={<button className="btn btn--block" disabled={take.isPending} onClick={() => take.mutate(o.id)}>Взять</button>} />
          ))}
        </div>
      )}
    </>
  );
}
