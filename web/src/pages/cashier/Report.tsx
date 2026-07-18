import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOTTLE_PRICE, ProductType, WATER_PRICE, WarehouseReportDto } from '@obi/shared';
import { getPayroll, getWarehouse, getProducts, createWarehouseReport, deleteWarehouseReport } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';

const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const timeOf = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
const num = (s: string) => parseInt(s || '0', 10) || 0;

type ItemRow = { key: string; productId: string; name: string; price: number; taken: string; returned: string };

export function Report() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [courierId, setCourierId] = useState('');
  const [fullTaken, setFullTaken] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [fullReturned, setFullReturned] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);

  const couriers = useQuery({ queryKey: ['payroll-couriers'], queryFn: () => getPayroll() });
  const wh = useQuery({ queryKey: ['warehouse', date], queryFn: () => getWarehouse(date) });
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts });

  // Прочие товары для добавления (всё, кроме 20л-обмена).
  const otherProducts = (products.data ?? []).filter((p) => p.type !== ProductType.WATER_20L);
  const rate = couriers.data?.find((c) => c.courierId === courierId)?.rate ?? 0;

  const preview = useMemo(() => {
    const ft = num(fullTaken), er = num(emptyReturned), fr = num(fullReturned);
    const fullSold = Math.max(0, ft - fr);
    const bottlesSold = Math.max(0, fullSold - er);
    const itemsRevenue = items.reduce((s, it) => s + Math.max(0, num(it.taken) - num(it.returned)) * it.price, 0);
    const total = fullSold * WATER_PRICE + bottlesSold * BOTTLE_PRICE + itemsRevenue;
    const salary = fullSold * rate;
    return { fullSold, bottlesSold, itemsRevenue, total, salary };
  }, [fullTaken, emptyReturned, fullReturned, items, rate]);

  const addItem = (productId: string) => {
    const p = otherProducts.find((x) => x.id === productId);
    if (!p) return;
    setItems((s) => [...s, { key: Math.random().toString(36).slice(2), productId: p.id, name: p.name, price: p.price, taken: '', returned: '' }]);
  };
  const setItem = (key: string, patch: Partial<ItemRow>) => setItems((s) => s.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  const removeItem = (key: string) => setItems((s) => s.filter((it) => it.key !== key));

  const create = useMutation({
    mutationFn: () => createWarehouseReport({
      courierId,
      fullTaken: num(fullTaken),
      emptyReturned: num(emptyReturned),
      fullReturned: num(fullReturned),
      note: note.trim() || undefined,
      items: items
        .filter((it) => num(it.taken) > 0 || num(it.returned) > 0)
        .map((it) => ({ productId: it.productId, name: it.name, price: it.price, taken: num(it.taken), returned: num(it.returned) })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['payroll-couriers'] });
      toast('Отчёт сохранён', 'success');
      setFullTaken(''); setEmptyReturned(''); setFullReturned(''); setNote(''); setItems([]);
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteWarehouseReport(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); qc.invalidateQueries({ queryKey: ['balances'] }); toast('Отчёт удалён', 'success'); },
  });

  const canSubmit = !!courierId && num(fullTaken) > 0;

  return (
    <>
      <div className="page__head">
        <h1>Отчёт по складу</h1>
        <div className="row" style={{ gap: 10 }}>
          <button className="chip" onClick={() => setDate((d) => shift(d, -1))}>◀</button>
          <b>{date === today ? 'Сегодня' : date}</b>
          <button className="chip" onClick={() => date < today && setDate((d) => shift(d, 1))}>▶</button>
        </div>
      </div>

      <div className="split split--narrow">
        {/* ─── Форма отчёта ─── */}
        <div className="card card--pad-lg">
          <h3>Новый отчёт</h3>
          <p className="hairline-muted" style={{ fontSize: 13, marginTop: 4 }}>Вода {WATER_PRICE} смн · бутыль {BOTTLE_PRICE} смн · доставка бесплатно</p>
          <div className="divider" />
          <div className="field">
            <label className="label">Доставщик</label>
            <select className="select" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
              <option value="">— выберите —</option>
              {(couriers.data ?? []).map((c) => <option key={c.courierId} value={c.courierId}>{c.courierName} · ставка {c.rate.toFixed(2)}</option>)}
            </select>
          </div>

          <div className="grid grid--2" style={{ gap: 12 }}>
            <div className="field"><label className="label">Взял 20л со склада</label>
              <input className="input" inputMode="numeric" value={fullTaken} onChange={(e) => setFullTaken(e.target.value.replace(/\D/g, ''))} placeholder="100" /></div>
            <div className="field"><label className="label">Принёс пустых</label>
              <input className="input" inputMode="numeric" value={emptyReturned} onChange={(e) => setEmptyReturned(e.target.value.replace(/\D/g, ''))} placeholder="95" /></div>
          </div>
          <div className="field"><label className="label">Вернул полных 20л (остаток) — необязательно</label>
            <input className="input" inputMode="numeric" value={fullReturned} onChange={(e) => setFullReturned(e.target.value.replace(/\D/g, ''))} placeholder="4" /></div>

          {/* Прочие товары */}
          {items.length > 0 && (
            <div className="stack" style={{ marginBottom: 12 }}>
              {items.map((it) => (
                <div key={it.key} className="card" style={{ padding: 12, background: 'var(--surface-alt)' }}>
                  <div className="row-between">
                    <b style={{ fontSize: 14 }}>{it.name}</b>
                    <button className="btn btn--ghost btn--sm" onClick={() => removeItem(it.key)}>✕</button>
                  </div>
                  <div className="grid grid--2" style={{ gap: 10, marginTop: 8 }}>
                    <div><label className="label">Взял</label><input className="input" inputMode="numeric" value={it.taken} onChange={(e) => setItem(it.key, { taken: e.target.value.replace(/\D/g, '') })} placeholder="0" /></div>
                    <div><label className="label">Вернул</label><input className="input" inputMode="numeric" value={it.returned} onChange={(e) => setItem(it.key, { returned: e.target.value.replace(/\D/g, '') })} placeholder="0" /></div>
                  </div>
                  <div className="hairline-muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Продано {Math.max(0, num(it.taken) - num(it.returned))} × {money(it.price)} = {money(Math.max(0, num(it.taken) - num(it.returned)) * it.price)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {otherProducts.length > 0 && (
            <div className="field">
              <label className="label">Добавить товар (кулер / 0.5л / помпа)</label>
              <select className="select" value="" onChange={(e) => { addItem(e.target.value); e.target.value = ''; }}>
                <option value="">+ товар…</option>
                {otherProducts.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}
              </select>
            </div>
          )}

          <div className="field"><label className="label">Заметка (необязательно)</label>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр.: 1 бутыль с дыркой — вода вылилась" style={{ minHeight: 64 }} /></div>

          {/* Живой расчёт */}
          <div className="revenue" style={{ padding: 20, marginBottom: 14 }}>
            <div className="row-between" style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>
              <span>Доставлено 20л: <b style={{ color: '#fff' }}>{preview.fullSold}</b></span>
              <span>С бочкой: <b style={{ color: '#fff' }}>{preview.bottlesSold}</b></span>
            </div>
            <div className="row-between" style={{ marginTop: 14 }}>
              <div><div className="revenue__label">К сдаче</div><div className="revenue__value" style={{ fontSize: 26 }}>{money(preview.total)}</div></div>
              <div style={{ textAlign: 'right' }}><div className="revenue__label">Зарплата</div><div className="revenue__value" style={{ fontSize: 26, color: '#7ee0a8' }}>{money(preview.salary)}</div></div>
            </div>
          </div>
          <button className="btn btn--block" disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>Сохранить отчёт</button>
        </div>

        {/* ─── Отчёты за день ─── */}
        <div>
          {wh.isLoading ? <Spinner /> : wh.isError ? <ErrorBox message={apiError(wh.error)} onRetry={wh.refetch} /> : (
            <>
              {wh.data!.summary.reportsCount > 0 && (
                <div className="revenue">
                  <div className="row-between">
                    <div><div className="revenue__label">За день · к сдаче</div><div className="revenue__value" style={{ fontSize: 30 }}>{money(wh.data!.summary.total)}</div></div>
                    <div style={{ textAlign: 'right' }}><div className="revenue__label">Зарплата всем</div><div className="revenue__value" style={{ fontSize: 30, color: '#7ee0a8' }}>{money(wh.data!.summary.salaryTotal)}</div></div>
                  </div>
                  <div className="revenue__sub">Доставлено 20л: {wh.data!.summary.fullSold} · с бочкой: {wh.data!.summary.bottlesSold} · отчётов: {wh.data!.summary.reportsCount}</div>
                </div>
              )}

              <div className="stack" style={{ marginTop: 14 }}>
                {wh.data!.reports.length === 0 ? <Empty text="Отчётов за этот день нет" icon="📦" /> : (
                  wh.data!.reports.map((r: WarehouseReportDto) => (
                    <div className="card" key={r.id} style={{ padding: 16 }}>
                      <div className="row-between">
                        <div><b>{r.courierName}</b> <span className="hairline-muted" style={{ fontSize: 13 }}>· {timeOf(r.createdAt)}</span></div>
                        <button className="btn btn--ghost btn--sm" onClick={() => confirm('Удалить отчёт?') && del.mutate(r.id)}>✕</button>
                      </div>
                      <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="hairline-muted" style={{ fontSize: 13 }}>Взял <b>{r.fullTaken}</b> · пустых <b>{r.emptyReturned}</b>{r.fullReturned > 0 ? <> · вернул <b>{r.fullReturned}</b></> : null}</span>
                      </div>
                      <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="chip">Доставлено 20л: {r.fullSold}</span>
                        {r.bottlesSold > 0 && <span className="chip">С бочкой: {r.bottlesSold}</span>}
                        {r.items.map((it) => <span key={it.id} className="chip">{it.name}: {it.sold}</span>)}
                      </div>
                      <div className="divider" />
                      <div className="row-between">
                        <span className="hairline-muted">К сдаче: <b style={{ color: 'var(--text)' }}>{money(r.total)}</b></span>
                        <span className="hairline-muted">Зарплата: <b style={{ color: 'var(--success)' }}>{money(r.salary)}</b></span>
                      </div>
                      {r.note && <div style={{ marginTop: 10, background: '#fff7e6', color: '#9a6a00', padding: '8px 12px', borderRadius: 10, fontSize: 13 }}>📝 {r.note}</div>}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
