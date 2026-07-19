import { useQuery } from '@tanstack/react-query';
import { getMyEarnings } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

const dt = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`; };

export function Earnings() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['my-earnings'], queryFn: getMyEarnings });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;
  const e = data!;

  return (
    <>
      <div className="page__head"><h1>Мой заработок</h1></div>

      <div className="revenue">
        <div className="revenue__label">К выплате (копилка)</div>
        <div className="revenue__value">{money(e.balance)}</div>
        <div className="revenue__sub">Ставка за бутыль 20л: {e.rate.toFixed(2)} смн</div>
      </div>

      <div className="kpis" style={{ marginTop: 16 }}>
        <div className="kpi"><b>{money(e.totalEarned)}</b><span>Заработано всего</span></div>
        <div className="kpi"><b>{money(e.totalPaid)}</b><span>Выплачено</span></div>
        <div className="kpi"><b>{money(e.balance)}</b><span>В копилке</span></div>
      </div>

      <h3 style={{ margin: '22px 0 12px' }}>История</h3>
      {e.reports.length === 0 ? <Empty text="Пока нет начислений" icon="💰" /> : (
        <div className="stack">
          {e.reports.map((r) => (
            <div className="card" key={r.id} style={{ padding: 16 }}>
              <div className="row-between">
                <span className="hairline-muted" style={{ fontSize: 13 }}>{dt(r.createdAt)}</span>
                <b style={{ color: 'var(--success)' }}>{money(r.salary)}</b>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="chip">Доставлено 20л: {r.delivered}</span>
                {r.items.map((name, i) => <span key={i} className="chip">{name}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
