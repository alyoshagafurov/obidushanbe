import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOTTLE_PRICE, WATER_PRICE, WarehouseReportDto } from '@obi/shared';
import { getPayroll, getWarehouse, createWarehouseReport, deleteWarehouseReport } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';

const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const timeOf = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };

export function Warehouse() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [courierId, setCourierId] = useState('');
  const [fullTaken, setFullTaken] = useState('');
  const [emptyReturned, setEmptyReturned] = useState('');
  const [fullReturned, setFullReturned] = useState('');

  const couriers = useQuery({ queryKey: ['payroll-couriers'], queryFn: () => getPayroll() });
  const wh = useQuery({ queryKey: ['warehouse', date], queryFn: () => getWarehouse(date) });

  // Живой расчёт по вводимым значениям.
  const preview = useMemo(() => {
    const ft = parseInt(fullTaken || '0', 10) || 0;
    const er = parseInt(emptyReturned || '0', 10) || 0;
    const fr = parseInt(fullReturned || '0', 10) || 0;
    const fullSold = Math.max(0, ft - fr);
    const bottlesSold = Math.max(0, fullSold - er);
    return { fullSold, bottlesSold, total: fullSold * WATER_PRICE + bottlesSold * BOTTLE_PRICE };
  }, [fullTaken, emptyReturned, fullReturned]);

  const create = useMutation({
    mutationFn: () => createWarehouseReport({
      courierId,
      fullTaken: parseInt(fullTaken || '0', 10) || 0,
      emptyReturned: parseInt(emptyReturned || '0', 10) || 0,
      fullReturned: parseInt(fullReturned || '0', 10) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse'] });
      toast('Отчёт сохранён', 'success');
      setFullTaken(''); setEmptyReturned(''); setFullReturned('');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteWarehouseReport(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); toast('Отчёт удалён', 'success'); },
  });

  const canSubmit = !!courierId && (parseInt(fullTaken || '0', 10) || 0) > 0;

  return (
    <>
      <div className="page__head">
        <h1>Склад · обмен тары</h1>
        <div className="row" style={{ gap: 10 }}>
          <button className="chip" onClick={() => setDate((d) => shift(d, -1))}>◀</button>
          <b>{date === today ? 'Сегодня' : date}</b>
          <button className="chip" onClick={() => date < today && setDate((d) => shift(d, 1))}>▶</button>
        </div>
      </div>

      <div className="split split--narrow">
        {/* Форма отчёта */}
        <div className="card card--pad-lg">
          <h3>Новый отчёт</h3>
          <p className="hairline-muted" style={{ fontSize: 13, marginTop: 4 }}>Вода {WATER_PRICE} смн · бутыль {BOTTLE_PRICE} смн · доставка бесплатно</p>
          <div className="divider" />
          <div className="field">
            <label className="label">Доставщик</label>
            <select className="select" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
              <option value="">— выберите —</option>
              {(couriers.data ?? []).map((c) => <option key={c.courierId} value={c.courierId}>{c.courierName}</option>)}
            </select>
          </div>
          <div className="grid grid--2" style={{ gap: 12 }}>
            <div className="field"><label className="label">Взял полных со склада</label>
              <input className="input" inputMode="numeric" value={fullTaken} onChange={(e) => setFullTaken(e.target.value.replace(/\D/g, ''))} placeholder="120" /></div>
            <div className="field"><label className="label">Принёс пустых</label>
              <input className="input" inputMode="numeric" value={emptyReturned} onChange={(e) => setEmptyReturned(e.target.value.replace(/\D/g, ''))} placeholder="100" /></div>
          </div>
          <div className="field"><label className="label">Вернул полных (остаток) — необязательно</label>
            <input className="input" inputMode="numeric" value={fullReturned} onChange={(e) => setFullReturned(e.target.value.replace(/\D/g, ''))} placeholder="0" /></div>

          {/* Живой расчёт */}
          <div className="revenue" style={{ padding: 20, marginBottom: 14 }}>
            <div className="row-between" style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>
              <span>Продано воды: <b style={{ color: '#fff' }}>{preview.fullSold}</b></span>
              <span>Новых бутылей: <b style={{ color: '#fff' }}>{preview.bottlesSold}</b></span>
            </div>
            <div className="revenue__label" style={{ marginTop: 10 }}>К сдаче</div>
            <div className="revenue__value" style={{ fontSize: 30 }}>{money(preview.total)}</div>
          </div>
          <button className="btn btn--block" disabled={!canSubmit || create.isPending} onClick={() => create.mutate()}>Сохранить отчёт</button>
        </div>

        {/* Отчёты за день */}
        <div>
          {wh.isLoading ? <Spinner /> : wh.isError ? <ErrorBox message={apiError(wh.error)} onRetry={wh.refetch} /> : (
            <>
              {wh.data!.summary.reportsCount > 0 && (
                <div className="revenue">
                  <div className="revenue__label">Итого за день · к сдаче</div>
                  <div className="revenue__value">{money(wh.data!.summary.total)}</div>
                  <div className="revenue__sub">
                    Взяли полных: {wh.data!.summary.fullTaken} · пустых вернули: {wh.data!.summary.emptyReturned} · продано тары: {wh.data!.summary.bottlesSold} · отчётов: {wh.data!.summary.reportsCount}
                  </div>
                </div>
              )}
              <div className="card" style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
                {wh.data!.reports.length === 0 ? <Empty text="Отчётов за этот день нет" icon="📦" /> : (
                  <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Время</th><th>Доставщик</th><th>Взял</th><th>Пустых</th><th>Тары</th><th>К сдаче</th><th></th></tr></thead>
                    <tbody>
                      {wh.data!.reports.map((r: WarehouseReportDto) => (
                        <tr key={r.id}>
                          <td className="hairline-muted">{timeOf(r.createdAt)}</td>
                          <td><b>{r.courierName}</b></td>
                          <td>{r.fullTaken}</td>
                          <td>{r.emptyReturned}</td>
                          <td>{r.bottlesSold}</td>
                          <td><b>{money(r.total)}</b></td>
                          <td><button className="btn btn--ghost btn--sm" onClick={() => confirm('Удалить отчёт?') && del.mutate(r.id)}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
