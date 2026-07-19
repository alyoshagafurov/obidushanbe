import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BOTTLE_PRICE, WATER_PRICE, CourierPayrollRow, WarehouseReportDto } from '@obi/shared';
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

type TripRow = { key: string; taken: string; empty: string; full: string };
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
        <div className="stack" style={{ maxWidth: 620, margin: '0 auto' }}>
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
      ? report.trips.map((t) => ({ key: rid(), taken: String(t.taken), empty: String(t.emptyReturned), full: t.fullReturned ? String(t.fullReturned) : '' }))
      : [{ key: rid(), taken: '', empty: '', full: '' }],
  );
  const [note, setNote] = useState(report?.note ?? '');
  const [extras, setExtras] = useState<ExtraRow[]>(() => (report?.items ?? []).map((i) => ({ key: rid(), name: i.name, amount: String(i.amount) })));
  const [open, setOpen] = useState(!!report); // раскрыт, если уже есть данные

  const preview = useMemo(() => {
    let delivered = 0, soldBottle = 0;
    for (const t of trips) {
      const d = Math.max(0, num(t.taken) - num(t.full));
      delivered += d;
      soldBottle += Math.max(0, d - num(t.empty));
    }
    const extrasSum = extras.reduce((s, e) => s + dec(e.amount), 0);
    return {
      delivered,
      soldBottle,
      total: delivered * WATER_PRICE + soldBottle * BOTTLE_PRICE + extrasSum,
      salary: delivered * courier.rate,
    };
  }, [trips, extras, courier.rate]);

  const save = useMutation({
    mutationFn: () => saveWarehouseReport({
      courierId: courier.courierId,
      date,
      trips: trips.map((t) => ({ taken: num(t.taken), emptyReturned: num(t.empty), fullReturned: num(t.full) })).filter((t) => t.taken > 0 || t.emptyReturned > 0 || t.fullReturned > 0),
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
  const addTrip = () => setTrips((s) => [...s, { key: rid(), taken: '', empty: '', full: '' }]);
  const removeTrip = (key: string) => setTrips((s) => (s.length > 1 ? s.filter((t) => t.key !== key) : s));

  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  return (
    <div className="card" style={{ padding: 16 }}>
      {/* Заголовок карточки — кликабельный */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
      >
        <div>
          <b style={{ fontSize: 17 }}>{courier.courierName}</b>
          <div className="hairline-muted" style={{ fontSize: 13 }}>ставка {courier.rate.toFixed(2)} · доставлено {preview.delivered}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="hairline-muted" style={{ fontSize: 12 }}>к сдаче</div>
          <b style={{ fontSize: 18 }}>{money(preview.total)}</b>
        </div>
      </button>

      {open && (
        <>
          <div className="divider" />
          {/* Рейсы */}
          <div className="stack">
            {trips.map((t, i) => (
              <div key={t.key}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="label" style={{ margin: 0 }}>Рейс {i + 1}</span>
                  {trips.length > 1 && <button className="btn btn--ghost btn--sm" style={{ height: 26, padding: '0 8px' }} onClick={() => removeTrip(t.key)}>убрать</button>}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <label style={{ flex: 1 }}><span className="hairline-muted" style={{ fontSize: 11 }}>Взял</span>
                    <input className="input" inputMode="numeric" value={t.taken} onChange={(e) => setTrip(t.key, { taken: onlyDigits(e.target.value) })} placeholder="100" /></label>
                  <label style={{ flex: 1 }}><span className="hairline-muted" style={{ fontSize: 11 }}>Пустых</span>
                    <input className="input" inputMode="numeric" value={t.empty} onChange={(e) => setTrip(t.key, { empty: onlyDigits(e.target.value) })} placeholder="95" /></label>
                  <label style={{ flex: 1 }}><span className="hairline-muted" style={{ fontSize: 11 }}>Полных назад</span>
                    <input className="input" inputMode="numeric" value={t.full} onChange={(e) => setTrip(t.key, { full: onlyDigits(e.target.value) })} placeholder="0" /></label>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm btn--block" style={{ marginTop: 10 }} onClick={addTrip}>+ рейс</button>

          {/* Ещё */}
          {extras.length > 0 && (
            <div className="stack" style={{ marginTop: 12 }}>
              {extras.map((e) => (
                <div key={e.key} className="row" style={{ gap: 8 }}>
                  <input className="input grow" value={e.name} onChange={(ev) => setExtras((s) => s.map((x) => (x.key === e.key ? { ...x, name: ev.target.value } : x)))} placeholder="Напр.: Кулер" />
                  <input className="input" style={{ width: 110 }} inputMode="decimal" value={e.amount} onChange={(ev) => setExtras((s) => s.map((x) => (x.key === e.key ? { ...x, amount: ev.target.value.replace(/[^\d.,]/g, '') } : x)))} placeholder="сумма" />
                  <button className="btn btn--ghost btn--sm" onClick={() => setExtras((s) => s.filter((x) => x.key !== e.key))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn--ghost btn--sm btn--block" style={{ marginTop: 8 }} onClick={() => setExtras((s) => [...s, { key: rid(), name: '', amount: '' }])}>+ Ещё (кулер, помпа…)</button>

          <div className="field" style={{ marginTop: 12 }}>
            <label className="label">Заметка</label>
            <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="напр.: 1 бутыль с дыркой" style={{ minHeight: 52 }} />
          </div>

          <div className="row-between" style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <span className="hairline-muted">С бочкой: <b style={{ color: 'var(--text)' }}>{preview.soldBottle}</b></span>
            <span className="hairline-muted">Зарплата: <b style={{ color: 'var(--success)' }}>{money(preview.salary)}</b></span>
          </div>

          <button className="btn btn--block" disabled={save.isPending} onClick={() => save.mutate()}>Сохранить · {money(preview.total)}</button>
        </>
      )}
    </div>
  );
}
