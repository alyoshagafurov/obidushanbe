import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api';
import { apiError } from '../../lib/api';
import { useCart } from '../../store/cart';
import { money, productImg } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function Catalog() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const cart = useCart();

  if (isLoading) return <Spinner label="Загрузка каталога…" />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;
  if (!data?.length) return <Empty text="Каталог пуст" />;

  return (
    <>
      <div className="promo-banner">
        <div className="promo-banner__blob" />
        <div style={{ position: 'relative' }}>
          <b>Оплата наличными при доставке 💵</b>
          <span>Закажите воду онлайн — привезём в день заказа по всему Душанбе</span>
        </div>
        <span className="promo-banner__icon">💧</span>
      </div>
      <div className="page__head"><h1>Каталог</h1></div>
      <div className="grid grid--products">
        {data.map((p) => {
          const qty = cart.lines[p.id]?.quantity ?? 0;
          return (
            <div className="prod" key={p.id}>
              <div className="prod__img"><img src={productImg(p.type, p.photoUrl)} alt={p.name} /></div>
              <div className="prod__name">{p.name}</div>
              <div className="prod__foot">
                <span className="prod__price">{money(p.price)}</span>
                {qty > 0 ? (
                  <span className="stepper">
                    <button onClick={() => cart.remove(p.id)}>−</button>
                    <b>{qty}</b>
                    <button onClick={() => cart.add(p)}>+</button>
                  </span>
                ) : (
                  <button className="iconbtn" onClick={() => cart.add(p)}>+</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
