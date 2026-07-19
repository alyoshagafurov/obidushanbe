import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WATER_PRICE, CourierPayrollRow, WarehouseReportDto } from '@obi/shared';
import { getPayroll, getWarehouse, saveWarehouseReport } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox } from '../../components/ui';
import { useToast } from '../../components/Toast';

const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const shift = (s: string, n: number) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const num = (s: string) => parseInt(s || '0', 10) || 0;
const dec = (s: string) => parseFloat((s || '0').replace(',', '.')) || 0;
const rid = () => Math.random().toString(36).slice(2);

type TripRow = { key: string; taken: string; empty: string };
type ExtraRow = { key: string; name: string; amount: string };

export function Report() {
  const today = todayStr();
  const [date, setDate] = useState(today);
  const couriers = useQuery({ queryKey: ['payroll-couriers'], queryFn: () => getPayroll() });
  const wh = useQuery({ queryKey: ['warehouse', date], queryFn: () => getWarehouse(date) });

  const loading = couriers.isLoading || wh.isLoading;
  const err = couriers.error || wh.error;

  return (
    <>
      <div className="page__head">
        <h1>Отчёт дня</h1>
        <div className="row" style={{ gap: 10 }}>
          <button className="chip" onClick={() => setDate((d) => shift(d, -1))}>◀</button>
          <b>{date === today ? 'Сегодня' : date}</b>
          <button className="chip" onClick={() => date < today && setDate((d) => shift(d, 1))}>▶</button>
        </div>
      </div>

      {loading ? <Spinner /> : err ? <ErrorBox message={apiError(err)} onRetry={() => { couriers.refetch(); wh.refetch(); }} /> : (
        <div className="sheet">
          {(couriers.data ?? []).map((c) => {
            const report = wh.data!.reports.find((r) => r.courierId === c.courierId);
            return <CourierSheet key={c.courierId + date} courier={c} date={date} report={report} />;
          })}
        </div>
      )}
    </>
  );
}

function CourierSheet({ courier, date, report }: { courier: CourierPayrollRow; date: string; report?: WarehouseReportDto }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [trips, setTrips] = useState<TripRow[]>(() =>
    report && report.trips.length
      ? report.trips.map((t) => ({ key: rid(), taken: String(t.taken), empty: t.emptyReturned ? String(t.emptyReturned) : '' }))
      : [{ key: rid(), taken: '', empty: '' }],
  );
  const [note, setNote] = useState(report?.note ?? '');
  const [extras, setExtras] = useState<ExtraRow[]>(() => (report?.items ?? []).map((i) => ({ key: rid(), name: i.name, amount: String(i.amount) })));
  const [open, setOpen] = useState(!!report);

  const preview = useMemo(() => {
    const delivered = trips.reduce((s, t) => s + num(t.taken), 0);
    const extrasSum = extras.reduce((s, e) => s + dec(e.amount), 0);
    return { delivered, total: delivered * WATER_PRICE + extrasSum, salary: delivered * courier.rate };
  }, [trips, extras, courier.rate]);

  const save = useMutation({
    mutationFn: () => saveWarehouseReport({
      courierId: courier.courierId,
      date,
      trips: trips.map((t) => ({ taken: num(t.taken), emptyReturned: num(t.empty) })).filter((t) => t.taken > 0 || t.emptyReturned > 0),
      note: note.trim() || undefined,
      items: extras.filter((e) => e.name.trim() && dec(e.amount) > 0).map((e) => ({ name: e.name.trim(), amount: dec(e.amount) })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouse'] });
      qc.invalidateQueries({ queryKey: ['balances'] });
      qc.invalidateQueries({ queryKey: ['payroll-couriers'] });
      qc.invalidateQueries({ queryKey: ['courier-reports'] });
      toast(`${courier.courierName}: сохранено`, 'success');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  const setTrip = (key: string, patch: Partial<TripRow>) => setTrips((s) => s.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  const digits = (v: string) => v.replace(/\D/g, '');
  const initial = (courier.courierName || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={`scard ${open ? 'scard--open' : ''}`}>
      <button className="scard__head" onClick={() => setOpen((o) => !o)}>
        <span className="scard__ava">{initial}</span>
        <span>
          <span className="scard__name">{courier.courierName}</span>
          <span className="scard__meta">ставка {courier.rate.toFixed(2)} · доставлено {preview.delivered}</span>
        </span>
        <span className="scard__money"><small>к сдаче</small><b>{money(preview.total)}</b></span>
      </button>

      {open && (
        <div className="scard__body">
          {trips.map((t, i) => (
            <div className="trip" key={t.key}>
              <div className="trip__head">
                <span className="trip__badge">🚚 Рейс {i + 1}</span>
                {trips.length > 1 && <button className="trip__rm" onClick={() => setTrips((s) => s.filter((x) => x.key !== t.key))}>удалить</button>}
              </div>
              <div className="trip__grid">
                <label className="minf"><span>Взял</span>
                  <input className="input" inputMode="numeric" value={t.taken} onChange={(e) => setTrip(t.key, { taken: digits(e.target.value) })} placeholder="100" /></label>
                <label className="minf"><span>Вернул</span>
                  <input className="input" inputMode="numeric" value={t.empty} onChange={(e) => setTrip(t.key, { empty: digits(e.target.value) })} placeholder="100" /></label>
              </div>
            </div>
          ))}

          <button className="dashbtn" onClick={() => setTrips((s) => [...s, { key: rid(), taken: '', empty: '' }])}>+ рейс</button>

          {extras.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {extras.map((e) => (
                <div className="xtra" key={e.key}>
                  <input className="input" value={e.name} onChange={(ev) => setExtras((s) => s.map((x) => (x.key === e.key ? { ...x, name: ev.target.value } : x)))} placeholder="Напр.: Бочка" />
                  <input className="input" style={{ width: 110 }} inputMode="decimal" value={e.amount} onChange={(ev) => setExtras((s) => s.map((x) => (x.key === e.key ? { ...x, amount: ev.target.value.replace(/[^\d.,]/g, '') } : x)))} placeholder="сумма" />
                  <button className="btn btn--ghost btn--sm" onClick={() => setExtras((s) => s.filter((x) => x.key !== e.key))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button className="dashbtn" style={{ marginTop: extras.length ? 0 : 8 }} onClick={() => setExtras((s) => [...s, { key: rid(), name: '', amount: '' }])}>+ Ещё (бочка, кулер, помпа…)</button>

          <div className="field" style={{ marginTop: 14 }}>
            <label className="label">Заметка</label>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр.: 1 бутыль с дыркой" style={{ minHeight: 52 }} />
          </div>

          <div className="scard__salary"><span>Зарплата доставщику</span><b>{money(preview.salary)}</b></div>

          <button className="btn btn--block btn--lg" disabled={save.isPending} onClick={() => save.mutate()}>Сохранить · {money(preview.total)}</button>
        </div>
      )}
    </div>
  );
}
