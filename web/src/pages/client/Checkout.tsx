import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AddressSnapshot } from '@obi/shared';
import { createOrder } from '../../api';
import { apiError } from '../../lib/api';
import { useCart } from '../../store/cart';
import { AddressEditor } from '../../components/AddressEditor';
import { money } from '../../lib/format';

const EMPTY: AddressSnapshot = { point: null, text: null, landmark: null };

export function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [address, setAddress] = useState<AddressSnapshot>(EMPTY);
  const [err, setErr] = useState('');

  const canSubmit = !!address.point || !!address.text?.trim();

  const mutation = useMutation({
    mutationFn: () =>
      createOrder({ items: cart.items().map((l) => ({ productId: l.product.id, quantity: l.quantity })), address }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      cart.clear();
      nav('/app/orders');
    },
    onError: (e) => setErr(apiError(e)),
  });

  if (!cart.items().length) { nav('/app'); return null; }

  return (
    <>
      <div className="page__head"><h1>Оформление</h1></div>
      <div className="split">
        <div className="card card--pad-lg">
          <h3>Адрес доставки</h3>
          <div className="divider" />
          <AddressEditor value={address} onChange={setAddress} />
        </div>
        <div className="card card--pad-lg">
          <h3>Ваш заказ</h3>
          <div className="divider" />
          {cart.items().map((l) => (
            <div className="row-between" key={l.product.id} style={{ marginBottom: 8 }}>
              <span className="muted">{l.product.name} × {l.quantity}</span>
              <span>{money(l.product.price * l.quantity)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row-between"><h3>Итого</h3><h3 style={{ color: 'var(--primary)' }}>{money(cart.total())}</h3></div>
          {err && <div style={{ color: 'var(--danger)', marginTop: 10 }}>{err}</div>}
          {!canSubmit && <div className="hairline-muted" style={{ marginTop: 10, fontSize: 14 }}>Поставьте точку на карте или укажите адрес</div>}
          <button className="btn btn--block" style={{ marginTop: 14 }} disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            Заказать
          </button>
        </div>
      </div>
    </>
  );
}
