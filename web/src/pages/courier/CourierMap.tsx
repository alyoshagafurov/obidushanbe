import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourierOrders } from '../../api';
import { apiError } from '../../lib/api';
import { MapPicker } from '../../components/MapPicker';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function CourierMap() {
  const nav = useNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['courier-orders', true], queryFn: () => getCourierOrders(true) });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  const markers = (data ?? [])
    .filter((o) => o.address.point)
    .map((o) => ({ id: o.id, lat: o.address.point!.lat, lng: o.address.point!.lng, onClick: () => nav(`/app/orders/${o.id}`) }));

  if (!markers.length) return <Empty text="Нет точек для показа" icon="🗺️" />;

  return (
    <>
      <div className="page__head"><h1>Карта доставки</h1><span className="muted">точек: {markers.length}</span></div>
      <MapPicker center={{ lat: markers[0].lat, lng: markers[0].lng }} markers={markers} height={520} />
      <p className="hairline-muted" style={{ marginTop: 10 }}>Нажмите на точку, чтобы открыть заказ. Порядок объезда выбираете сами.</p>
    </>
  );
}
