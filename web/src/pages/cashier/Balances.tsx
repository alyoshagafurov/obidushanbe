import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayroll, payoutCourier, getCourierReports } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';

const dt = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`; };

export function Balances() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['balances'], queryFn: () => getPayroll() });
  const [openId, setOpenId] = useState<string | null>(null);
  const [openName, setOpenName] = useState('');

  const pay = useMutation({
    mutationFn: (courierId: string) => payoutCourier({ courierId }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['balances'] }); qc.invalidateQueries({ queryKey: ['payroll'] }); toast(`Выплачено: ${money(r.paid)}`, 'success'); },
    onError: (e) => toast(apiError(e), 'error'),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;
  const total = (data ?? []).reduce((s, r) => s + r.balance, 0);

  return (
    <>
      <div className="page__head"><h1>Копилка</h1></div>
      {!data?.length ? <Empty text="Нет доставщиков" icon="🚚" /> : (
        <>
          <div className="revenue"><div className="revenue__label">Итого по всем</div><div className="revenue__value">{money(total)}</div></div>
          <div className="grid grid--2" style={{ marginTop: 16 }}>
            {data.map((r) => (
              <div className="card" key={r.courierId}>
                <button
                  className="row-between"
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => { setOpenId(r.courierId); setOpenName(r.courierName); }}
                >
                  <b>{r.courierName} <span className="hairline-muted" style={{ fontWeight: 400, fontSize: 13 }}>· подробнее ›</span></b>
                  <h2 style={{ color: r.balance > 0 ? 'var(--success)' : 'var(--muted)' }}>{money(r.balance)}</h2>
                </button>
                <div className="divider" />
                <div className="row-between hairline-muted"><span>Заработано: {money(r.totalEarned)}</span><span>Выплачено: {money(r.totalPaid)}</span></div>
                <button className="btn btn--success btn--block" style={{ marginTop: 12 }} disabled={r.balance <= 0 || pay.isPending}
                  onClick={() => confirm(`Выплатить ${r.courierName} ${money(r.balance)}?`) && pay.mutate(r.courierId)}>Выплатить</button>
              </div>
            ))}
          </div>
        </>
      )}

      {openId && <CourierDetail courierId={openId} name={openName} onClose={() => setOpenId(null)} />}
    </>
  );
}

/** Раскрытие копилки: почему столько денег — список отчётов + заметки. */
function CourierDetail({ courierId, name, onClose }: { courierId: string; name: string; onClose: () => void }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courier-reports', courierId],
    queryFn: () => getCourierReports(courierId),
  });
  const totalSalary = (data ?? []).reduce((s, r) => s + r.salary, 0);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h3>{name} · за что начислено</h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>
        {isLoading ? <Spinner /> : isError ? <ErrorBox message={apiError(error)} onRetry={refetch} /> : (
          <>
            <div className="revenue" style={{ padding: 16, margin: '12px 0' }}>
              <div className="revenue__label">Всего начислено</div>
              <div className="revenue__value" style={{ fontSize: 26 }}>{money(totalSalary)}</div>
              <div className="revenue__sub">Отчётов: {data!.length}</div>
            </div>
            {data!.length === 0 ? <Empty text="Отчётов пока нет" icon="📦" /> : (
              <div className="stack">
                {data!.map((r) => (
                  <div className="card" key={r.id} style={{ padding: 14 }}>
                    <div className="row-between">
                      <span className="hairline-muted" style={{ fontSize: 13 }}>{dt(r.createdAt)}</span>
                      <b style={{ color: 'var(--success)' }}>{money(r.salary)}</b>
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <span className="chip">Доставлено 20л: {r.fullSold}</span>
                      {r.bottlesSold > 0 && <span className="chip">С бочкой: {r.bottlesSold}</span>}
                      {r.items.map((it) => <span key={it.id} className="chip">{it.name}: {it.sold}</span>)}
                    </div>
                    {r.note && <div style={{ marginTop: 10, background: '#fff7e6', color: '#9a6a00', padding: '8px 12px', borderRadius: 10, fontSize: 13 }}>📝 {r.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
