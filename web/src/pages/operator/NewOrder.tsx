import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AddressSnapshot, PHONE_REGEX } from '@obi/shared';
import { getProducts, lookupClient, createOperatorOrder } from '../../api';
import { apiError } from '../../lib/api';
import { AddressEditor } from '../../components/AddressEditor';
import { money, productImg } from '../../lib/format';
import { Spinner } from '../../components/ui';

const EMPTY: AddressSnapshot = { point: null, text: null, landmark: null };

export function NewOrder() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const [phone, setPhone] = useState('+992');
  const [name, setName] = useState('');
  const [found, setFound] = useState<'found' | 'new' | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [address, setAddress] = useState<AddressSnapshot>(EMPTY);
  const [msg, setMsg] = useState('');

  const lookup = async () => {
    const p = phone.replace(/\s/g, '');
    if (!PHONE_REGEX.test(p)) return setMsg('Неверный номер');
    setMsg('');
    try {
      const r = await lookupClient(p);
      if (r.exists) {
        setFound('found'); setName(r.name ?? '');
        const a = r.addresses?.[0];
        if (a) setAddress({ point: a.lat != null && a.lng != null ? { lat: a.lat, lng: a.lng } : null, text: a.text ?? null, landmark: a.landmark ?? null });
      } else setFound('new');
    } catch (e) { setMsg(apiError(e)); }
  };

  const setQty = (id: string, d: number) => setQtys((s) => {
    const n = Math.max(0, (s[id] ?? 0) + d); const c = { ...s };
    if (n === 0) delete c[id]; else c[id] = n; return c;
  });

  const items = Object.entries(qtys).map(([productId, quantity]) => ({ productId, quantity }));
  const total = (products.data ?? []).reduce((s, p) => s + (qtys[p.id] ?? 0) * p.price, 0);
  const canSubmit = PHONE_REGEX.test(phone.replace(/\s/g, '')) && items.length > 0 && (!!address.point || !!address.text?.trim());

  const mutation = useMutation({
    mutationFn: () => createOperatorOrder({ clientPhone: phone.replace(/\s/g, ''), clientName: name.trim() || undefined, items, address }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operator-orders'] });
      setMsg('✓ Заказ создан'); setPhone('+992'); setName(''); setFound(null); setQtys({}); setAddress(EMPTY);
    },
    onError: (e) => setMsg(apiError(e)),
  });

  if (products.isLoading) return <Spinner />;

  return (
    <>
      <div className="page__head"><h1>Новый заказ</h1></div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div>
          <div className="card">
            <label className="label">Телефон клиента</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input grow" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
              <button className="btn btn--sm" onClick={lookup}>Найти</button>
            </div>
            {found === 'found' && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 6 }}>✓ Клиент найден</div>}
            {found === 'new' && <div style={{ color: 'var(--warning)', fontSize: 13, marginTop: 6 }}>Новый клиент</div>}
            <div className="field" style={{ marginTop: 12 }}>
              <label className="label">Имя клиента</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="card">
            <h3>Товары</h3><div className="divider" />
            {(products.data ?? []).map((p) => (
              <div className="row" key={p.id} style={{ gap: 12, marginBottom: 10 }}>
                <img className="thumb-blend" src={productImg(p.type, p.photoUrl)} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                <div className="grow"><div>{p.name}</div><div className="hairline-muted">{money(p.price)}</div></div>
                <span className="stepper"><button onClick={() => setQty(p.id, -1)}>−</button><b>{qtys[p.id] ?? 0}</b><button onClick={() => setQty(p.id, 1)}>+</button></span>
              </div>
            ))}
            <div className="divider" />
            <div className="row-between"><h3>Итого</h3><h3 style={{ color: 'var(--primary)' }}>{money(total)}</h3></div>
          </div>
        </div>
        <div className="card card--pad-lg">
          <h3>Адрес</h3><div className="divider" />
          <AddressEditor value={address} onChange={setAddress} />
          {msg && <div style={{ marginTop: 10, color: msg.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>{msg}</div>}
          <button className="btn btn--block" style={{ marginTop: 12 }} disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>Создать заказ</button>
        </div>
      </div>
    </>
  );
}
