import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus, UserRole } from '@obi/shared';
import { getOrder, updateOrderStatus, createReview } from '../../api';
import { apiError } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useOrdersRealtime } from '../../hooks/useOrdersRealtime';
import { MapPicker } from '../../components/MapPicker';
import { Spinner, ErrorBox, StatusBadge, Stars } from '../../components/ui';
import { money, dateTime } from '../../lib/format';

export function OrderDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { data: order, isLoading, isError, error, refetch } = useQuery({ queryKey: ['order', id], queryFn: () => getOrder(id) });
  useOrdersRealtime([['order', id], ['my-orders'], ['courier-orders']]);

  const statusMut = useMutation({
    mutationFn: (s: OrderStatus) => updateOrderStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', id] }); qc.invalidateQueries({ queryKey: ['courier-orders'] }); },
    onError: (e) => alert(apiError(e)),
  });

  const reviewMut = useMutation({
    mutationFn: () => createReview({ orderId: id, rating, text: reviewText.trim() || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', id] }); setReviewOpen(false); },
    onError: (e) => alert(apiError(e)),
  });

  if (isLoading) return <Spinner />;
  if (isError || !order) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  const isClient = role === UserRole.CLIENT;
  const isCourier = role === UserRole.COURIER;

  return (
    <>
      <button className="muted" onClick={() => nav(-1)} style={{ marginBottom: 14 }}>← Назад</button>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div>
          <div className="card">
            <div className="row-between"><h2>{money(order.total)}</h2><StatusBadge status={order.status} /></div>
            <div className="hairline-muted" style={{ marginTop: 4 }}>Заказ · {dateTime(order.createdAt)}</div>
          </div>
          <div className="card">
            <h3>Состав заказа</h3><div className="divider" />
            {order.items.map((it) => (
              <div className="row-between" key={it.id} style={{ marginBottom: 6 }}>
                <span>{it.productName} × {it.quantity}</span><span>{money(it.unitPrice * it.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Адрес</h3><div className="divider" />
            {order.address.text && <div>📍 {order.address.text}</div>}
            {order.address.landmark && <div className="hairline-muted" style={{ fontStyle: 'italic', marginTop: 4 }}>💬 {order.address.landmark}</div>}
            {order.address.point && <div style={{ marginTop: 12 }}><MapPicker center={order.address.point} markers={[{ id: order.id, ...order.address.point }]} height={220} /></div>}
            {order.clientPhone && !isClient && (
              <a className="btn btn--ghost btn--sm btn--block" style={{ marginTop: 12 }} href={`tel:${order.clientPhone}`}>Телефон клиента: {order.clientPhone}</a>
            )}
          </div>

          {isClient && order.courier && (
            <div className="card">
              <h3>Доставщик</h3><div className="divider" />
              <div className="row" style={{ gap: 12 }}>
                <div className="grow"><b>{order.courier.name}</b>
                  <div className="row" style={{ gap: 6 }}><Stars value={order.courier.rating} size={14} /><span className="hairline-muted">{order.courier.rating.toFixed(1)} · {order.courier.deliveriesCount} дост.</span></div>
                </div>
              </div>
              <button className="btn btn--light btn--block" style={{ marginTop: 12 }}
                onClick={() => nav(`/app/chat/${order.courier!.id}?order=${order.id}&name=${encodeURIComponent(order.courier!.name)}`)}>
                Написать доставщику
              </button>
            </div>
          )}
          {isClient && !order.courier && <div className="card hairline-muted" style={{ textAlign: 'center' }}>Ожидает доставщика</div>}

          {isCourier && (
            <div className="card">
              <h3>Доставка</h3><div className="divider" />
              {order.status === OrderStatus.ON_WAY ? (
                <button className="btn btn--success btn--block" disabled={statusMut.isPending} onClick={() => statusMut.mutate(OrderStatus.DELIVERED)}>Доставлено</button>
              ) : (
                <div className="hairline-muted"><StatusBadge status={order.status} /></div>
              )}
              <button className="btn btn--light btn--block" style={{ marginTop: 10 }}
                onClick={() => nav(`/app/chat/${order.clientId}?order=${order.id}&name=${encodeURIComponent(order.clientName ?? 'Клиент')}`)}>
                Чат с клиентом
              </button>
            </div>
          )}

          {isClient && order.status === OrderStatus.DELIVERED && order.courier && !order.reviewed && (
            <button className="btn btn--block" onClick={() => setReviewOpen(true)}>Оставить отзыв</button>
          )}
          {isClient && order.reviewed && <div className="hairline-muted" style={{ textAlign: 'center' }}>✓ Отзыв оставлен</div>}
        </div>
      </div>

      {reviewOpen && (
        <div className="modal-bg" onClick={() => setReviewOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Оцените доставку</h3>
            <div style={{ textAlign: 'center', margin: '18px 0' }}><Stars value={rating} onChange={setRating} size={40} /></div>
            <textarea className="textarea" placeholder="Комментарий (необязательно)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <button className="btn btn--block" style={{ marginTop: 12 }} disabled={reviewMut.isPending} onClick={() => reviewMut.mutate()}>Отправить отзыв</button>
          </div>
        </div>
      )}
    </>
  );
}
