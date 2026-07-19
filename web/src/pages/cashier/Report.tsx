import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOTTLE_PRICE, WATER_PRICE } from '@obi/shared';
import { getPayroll, createWarehouseReport } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox } from '../../components/ui';
import { useToast } from '../../components/Toast';

const num = (s: string) => parseInt(s || '0', 10) || 0;
const dec = (s: string) => parseFloat((s || '0').replace(',', '.')) || 0;

type ExtraRow = { key: string; name: string; amount: string };

export function Report() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [courierId, setCourierId] = useState('');
  const [fullTaken, setFullTaken] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [note, setNote] = useState('');
  const [extras, setExtras] = useState<ExtraRow[]>([]);

  const couriers = useQuery({ queryKey: ['payroll-couriers'], queryFn: () => getPayroll() });
  const rate = couriers.data?.find((c) => c.courierId === courierId)?.rate ?? 0;

  const preview = useMemo(() => {
    const ft = num(fullTaken), er = num(emptyReturned);
    const bottlesSold = Math.max(0, ft - er);
    const extrasSum = extras.reduce((s, e) => s + dec(e.amount), 0);
    const total = ft * WATER_PRICE + bottlesSold * BOTTLE_PRICE + extrasSum;
    const salary = ft * rate;
    return { delivered: ft, bottlesSold, total, salary };
  }, [fullTaken, emptyReturned, extras, rate]);

  const addExtra = () => setExtras((s) => [...s, { key: Math.random().toString(36).slice(2), name: '', amount: '' }]);
  const setExtra = (key: string, patch: Partial<ExtraRow>) => setExtras((s) => s.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const removeExtra = (key: string) => setExtras((s) => s.filter((e) => e.key !== key));

  const create = useMutation({
    mutationFn: () => createWarehouseReport({
      courierId,
      fullTaken: num(fullTaken),
      emptyReturned: num(emptyReturned),
      note: note.trim() || undefined,
      items: extras
        .filter((e) => e.name.trim() && dec(e.amount) > 0)
        .map((e) => ({ name: e.name.trim(), amount: dec(e.amount) })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['payroll-couriers'] });
      qc.invalidateQueries({ queryKey: ['courier-reports'] });
      toast('Отчёт сохранён', 'success');
      setCourierId(''); setFullTaken(''); setEmptyReturned(''); setNote(''); setExtras([]);
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  const canSubmit = !!courierId && num(fullTaken) > 0;

  if (couriers.isLoading) return <Spinner />;
  if (couriers.isError) return <ErrorBox message={apiError(couriers.error)} onRetry={couriers.refetch} />;

  return (
    <>
      <div className="page__head"><h1>Отчёт дня</h1></div>

      <div className="card card--pad-lg" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="field">
          <label className="label">Доставщик</label>
          <select className="select" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
            <option value="">— выберите —</option>
            {(couriers.data ?? []).map((c) => <option key={c.courierId} value={c.courierId}>{c.courierName} · ставка {c.rate.toFixed(2)}</option>)}
          </select>
        </div>

        <div className="grid grid--2" style={{ gap: 12 }}>
          <div className="field"><label className="label">Взял бутылей 20л</label>
            <input className="input" inputMode="numeric" value={fullTaken} onChange={(e) => setFullTaken(e.target.value.replace(/\D/g, ''))} placeholder="100" /></div>
          <div className="field"><label className="label">Принёс пустых</label>
            <input className="input" inputMode="numeric" value={emptyReturned} onChange={(e) => setEmptyReturned(e.target.value.replace(/\D/g, ''))} placeholder="95" /></div>
        </div>

        <div className="field"><label className="label">Заметка</label>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр.: 1 бутыль с дыркой — вода вылилась" style={{ minHeight: 64 }} /></div>

        {/* «Ещё» — свободные позиции: название + сумма */}
        {extras.length > 0 && (
          <div className="stack" style={{ marginBottom: 12 }}>
            {extras.map((e) => (
              <div key={e.key} className="row" style={{ gap: 8 }}>
                <input className="input grow" value={e.name} onChange={(ev) => setExtra(e.key, { name: ev.target.value })} placeholder="Напр.: Кулер" />
                <input className="input" style={{ width: 120 }} inputMode="decimal" value={e.amount} onChange={(ev) => setExtra(e.key, { amount: ev.target.value.replace(/[^\d.,]/g, '') })} placeholder="сумма" />
                <button className="btn btn--ghost btn--sm" onClick={() => removeExtra(e.key)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn--ghost btn--block" style={{ marginBottom: 14 }} onClick={addExtra}>+ Ещё (кулер, помпа…)</button>

        {/* Живой расчёт — платформа считает сама */}
        <div className="revenue" style={{ padding: 20, marginBottom: 14 }}>
          <div className="row-between" style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>
            <span>Доставлено 20л: <b style={{ color: '#fff' }}>{preview.delivered}</b></span>
            <span>С бочкой: <b style={{ color: '#fff' }}>{preview.bottlesSold}</b></span>
          </div>
          <div className="row-between" style={{ marginTop: 14 }}>
            <div><div className="revenue__label">К сдаче</div><div className="revenue__value" style={{ fontSize: 26 }}>{money(preview.total)}</div></div>
            <div style={{ textAlign: 'right' }}><div className="revenue__label">Зарплата</div><div className="revenue__value" style={{ fontSize: 26, color: '#7ee0a8' }}>{money(preview.salary)}</div></div>
          </div>
        </div>

        <button className="btn btn--block btn--lg" disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>Сохранить отчёт</button>
      </div>
    </>
  );
}
