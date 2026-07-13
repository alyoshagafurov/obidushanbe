import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStats } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { ErrorBox, Skeleton, Avatar } from '../../components/ui';
import { AreaChart, Donut } from '../../components/Charts';

type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: { v: Period; l: string }[] = [
  { v: 'day', l: 'День' }, { v: 'week', l: 'Неделя' }, { v: 'month', l: 'Месяц' }, { v: 'year', l: 'Год' },
];
const MIX_COLORS = ['#0E72C9', '#1A9D58', '#E0A100', '#8E44AD', '#E4572E', '#16A5A5'];
const MEDAL = ['🥇', '🥈', '🥉'];

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['stats', period], queryFn: () => getStats({ period }) });
  const day = (s: string) => s.slice(8, 10) + '.' + s.slice(5, 7);

  const avgCheck = data && data.deliveredOrders ? data.revenue / data.deliveredOrders : 0;

  return (
    <>
      <div className="page__head">
        <h1>Дашборд</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODS.map((p) => <button key={p.v} className={`chip ${period === p.v ? 'chip--active' : ''}`} onClick={() => setPeriod(p.v)}>{p.l}</button>)}
        </div>
      </div>

      {isLoading ? (
        <><Skeleton h={130} r={20} /><div className="kpis" style={{ marginTop: 16 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={90} r={20} />)}</div></>
      ) : isError || !data ? <ErrorBox message={apiError(error)} onRetry={refetch} /> : (
        <>
          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'stretch' }}>
            <div className="revenue" style={{ margin: 0 }}>
              <div className="revenue__label">Выручка за период</div>
              <div className="revenue__value">{money(data.revenue)}</div>
              <div className="revenue__sub">{data.deliveredOrders} доставлено · {data.totalOrders} заказов · средний чек {money(avgCheck)}</div>
              <div style={{ marginTop: 14, opacity: 0.95 }}>
                <AreaChart color="#8fd0ff" height={150} fmt={(n) => String(Math.round(n))} data={data.timeseries.map((p) => ({ label: day(p.date), value: p.revenue }))} />
              </div>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <h3>Структура продаж</h3><div className="divider" />
              <Donut segments={data.productSales.slice(0, 6).map((p, i) => ({ label: p.productName.split(' ').slice(0, 2).join(' '), value: p.quantity, color: MIX_COLORS[i % MIX_COLORS.length] }))} />
            </div>
          </div>

          <div className="kpis" style={{ margin: '16px 0' }}>
            <div className="kpi"><b>{data.newClients}</b><span>Новых клиентов</span></div>
            <div className="kpi"><b>{data.totalOrders}</b><span>Всего заказов</span></div>
            <div className="kpi"><b>{data.deliveredOrders}</b><span>Доставлено</span></div>
          </div>

          <div className="grid grid--2">
            <div className="card"><h3>Заказы по дням</h3><div className="divider" />
              <AreaChart color="#1f8ae0" data={data.timeseries.map((p) => ({ label: day(p.date), value: p.ordersCount }))} />
            </div>
            <div className="card">
              <h3>Топ доставщиков</h3><div className="divider" />
              {data.topCouriers.length ? data.topCouriers.slice(0, 6).map((c, i) => (
                <div className="row" key={c.courierId} style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                  <span style={{ width: 24, textAlign: 'center', fontSize: 18 }}>{MEDAL[i] ?? `${i + 1}`}</span>
                  <Avatar name={c.courierName} size={38} />
                  <div className="grow"><b>{c.courierName}</b><div className="hairline-muted" style={{ fontSize: 13 }}>{c.deliveriesCount} доставок · ★ {c.rating.toFixed(1)}</div></div>
                  <b>{money(c.revenue)}</b>
                </div>
              )) : <div className="hairline-muted">Нет данных</div>}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Продажи по товарам</h3><div className="divider" />
            {data.productSales.map((p, i) => {
              const max = Math.max(1, ...data.productSales.map((x) => x.quantity));
              return (
                <div key={p.productId} style={{ padding: '8px 0' }}>
                  <div className="row-between" style={{ marginBottom: 6 }}><span>{p.productName}</span><span className="hairline-muted">{p.quantity} шт · {money(p.revenue)}</span></div>
                  <div style={{ height: 8, background: 'var(--surface-alt)', borderRadius: 999 }}>
                    <div style={{ height: 8, width: `${(p.quantity / max) * 100}%`, background: MIX_COLORS[i % MIX_COLORS.length], borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
