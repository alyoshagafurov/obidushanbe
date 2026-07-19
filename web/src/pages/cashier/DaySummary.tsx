import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarehouseReportDto } from '@obi/shared';
import { getWarehouse, deleteWarehouseReport } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';

const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const timeOf = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };

export function DaySummary() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = todayStr();
  const [date, setDate] = useState(today);
  const wh = useQuery({ queryKey: ['warehouse', date], queryFn: () => getWarehouse(date) });

  const del = useMutation({
    mutationFn: (id: string) => deleteWarehouseReport(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouse'] }); qc.invalidateQueries({ queryKey: ['balances'] }); toast('Отчёт удалён', 'success'); },
  });

  return (
    <>
      <div className="page__head">
        <h1>Итоги дня</h1>
        <div className="row" style={{ gap: 10 }}>
          <button className="chip" onClick={() => setDate((d) => shift(d, -1))}>◀</button>
          <b>{date === today ? 'Сегодня' : date}</b>
          <button className="chip" onClick={() => date < today && setDate((d) => shift(d, 1))}>▶</button>
        </div>
      </div>

      {wh.isLoading ? <Spinner /> : wh.isError ? <ErrorBox message={apiError(wh.error)} onRetry={wh.refetch} /> : (
        <>
          <div className="revenue">
            <div className="row-between">
              <div><div className="revenue__label">За день · к сдаче</div><div className="revenue__value">{money(wh.data!.summary.total)}</div></div>
              <div style={{ textAlign: 'right' }}><div className="revenue__label">Зарплата всем</div><div className="revenue__value" style={{ color: '#7ee0a8' }}>{money(wh.data!.summary.salaryTotal)}</div></div>
            </div>
            <div className="revenue__sub">Доставлено 20л: {wh.data!.summary.fullSold} · с бочкой: {wh.data!.summary.bottlesSold} · отчётов: {wh.data!.summary.reportsCount}</div>
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            {wh.data!.reports.length === 0 ? <Empty text="Отчётов за этот день нет" icon="📦" /> : (
              wh.data!.reports.map((r: WarehouseReportDto) => (
                <div className="card" key={r.id} style={{ padding: 16 }}>
                  <div className="row-between">
                    <div><b>{r.courierName}</b> <span className="hairline-muted" style={{ fontSize: 13 }}>· {timeOf(r.createdAt)}</span></div>
                    <button className="btn btn--ghost btn--sm" onClick={() => confirm('Удалить отчёт?') && del.mutate(r.id)}>✕</button>
                  </div>
                  <div className="row" style={{ gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className="hairline-muted" style={{ fontSize: 13 }}>Рейсов: <b>{r.trips.length}</b> · взял <b>{r.fullTaken}</b> · пустых <b>{r.emptyReturned}</b>{r.fullReturned > 0 ? <> · полных назад <b>{r.fullReturned}</b></> : null}</span>
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span className="chip">Доставлено 20л: {r.fullSold}</span>
                    {r.bottlesSold > 0 && <span className="chip">С бочкой: {r.bottlesSold}</span>}
                    {r.items.map((it) => <span key={it.id} className="chip">{it.name}: {money(it.amount)}</span>)}
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
    </>
  );
}
