import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/cart';
import { money, productImg } from '../../lib/format';
import { Empty } from '../../components/ui';

export function Cart() {
  const cart = useCart();
  const nav = useNavigate();
  const items = cart.items();

  if (!items.length) return <Empty text="Корзина пуста" icon="🛒" />;

  return (
    <>
      <div className="page__head"><h1>Корзина</h1></div>
      <div style={{ maxWidth: 640 }}>
        {items.map((l) => (
          <div className="card" key={l.product.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img className="thumb-blend" src={productImg(l.product.type, l.product.photoUrl)} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            <div className="grow">
              <b>{l.product.name}</b>
              <div className="hairline-muted">{money(l.product.price)} × {l.quantity}</div>
            </div>
            <span className="stepper">
              <button onClick={() => cart.remove(l.product.id)}>−</button>
              <b>{l.quantity}</b>
              <button onClick={() => cart.add(l.product)}>+</button>
            </span>
          </div>
        ))}
        <div className="card">
          <div className="row-between"><h3>Итого</h3><h3 style={{ color: 'var(--primary)' }}>{money(cart.total())}</h3></div>
          <div className="divider" />
          <button className="btn btn--block" onClick={() => nav('/app/checkout')}>Оформить заказ</button>
          <button className="btn btn--ghost btn--block" style={{ marginTop: 10 }} onClick={cart.clear}>Очистить</button>
        </div>
        <Link to="/app" className="muted">← В каталог</Link>
      </div>
    </>
  );
}
