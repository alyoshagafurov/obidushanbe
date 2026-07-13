import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayroll, saveEntry } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (s: string, d: number) => { const x = new Date(s + 'T00:00:00'); x.setDate(x.getDate() + d); return todayStrFrom(x); };
const todayStrFrom = (d: Date) => { const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

export function Day() {
  const qc = useQueryClient();
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['payroll', date], queryFn: () => getPayroll(date) });

  useEffect(() => { if (data) { const n: Record<string, string> = {}; data.forEach((r) => (n[r.courierId] = String(r.bottlesToday))); setEdits(n); } }, [data]);

  const save = useMutation({
    mutationFn: (v: { courierId: string; bottles: number }) => saveEntry({ courierId: v.courierId, bottles: v.bottles, date }),
    onSuccess: (rows) => qc.setQueryData(['payroll', date], rows),
    onError: (e) => alert(apiError(e)),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  const totalBottles = (data ?? []).reduce((s, r) => s + r.bottlesToday, 0);
  const totalAmount = (data ?? []).reduce((s, r) => s + r.amountToday, 0);

  return (
    <>
      <div className="page__head">
        <h1>Зарплата за день</h1>
        <div className="row" style={{ gap: 10 }}>
          <button className="chip" onClick={() => setDate((d) => shift(d, -1))}>◀</button>
          <b>{date === today ? 'Сегодня' : date}</b>
          <button className="chip" onClick={() => date < today && setDate((d) => shift(d, 1))}>▶</button>
        </div>
      </div>
      {!data?.length ? <Empty text="Нет активных доставщиков" icon="🚚" /> : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr><th>Доставщик</th><th>Ставка</th><th>Бутылей 20л</th><th>По приложению</th><th>Сумма</th><th></th></tr></thead>
              <tbody>
                {data.map((r) => {
                  const val = edits[r.courierId] ?? String(r.bottlesToday);
                  const bottles = parseInt(val || '0', 10) || 0;
                  const changed = bottles !== r.bottlesToday;
                  return (
                    <tr key={r.courierId}>
                      <td><b>{r.courierName}</b></td>
                      <td>{r.rate.toFixed(2)}</td>
                      <td><input className="input" style={{ height: 40, width: 90 }} inputMode="numeric" value={val}
                        onChange={(e) => setEdits((s) => ({ ...s, [r.courierId]: e.target.value.replace(/\D/g, '') }))} /></td>
                      <td className="hairline-muted">{r.appBottlesToday}</td>
                      <td><b>{money(bottles * r.rate)}</b></td>
                      <td><button className="btn btn--sm" disabled={!changed || save.isPending} onClick={() => save.mutate({ courierId: r.courierId, bottles })}>{changed ? 'Сохранить' : '✓'}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="revenue" style={{ marginTop: 16 }}>
            <div className="revenue__label">Итого за день</div>
            <div className="revenue__value">{money(totalAmount)}</div>
            <div className="revenue__sub">Всего бутылей: {totalBottles}</div>
          </div>
        </>
      )}
    </>
  );
}
