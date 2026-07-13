import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayroll, payoutCourier } from '../../api';
import { apiError } from '../../lib/api';
import { money } from '../../lib/format';
import { Spinner, ErrorBox, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';

export function Balances() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['balances'], queryFn: () => getPayroll() });
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
                <div className="row-between"><b>{r.courierName}</b>
                  <h2 style={{ color: r.balance > 0 ? 'var(--success)' : 'var(--muted)' }}>{money(r.balance)}</h2>
                </div>
                <div className="divider" />
                <div className="row-between hairline-muted"><span>Заработано: {money(r.totalEarned)}</span><span>Выплачено: {money(r.totalPaid)}</span></div>
                <button className="btn btn--success btn--block" style={{ marginTop: 12 }} disabled={r.balance <= 0 || pay.isPending}
                  onClick={() => confirm(`Выплатить ${r.courierName} ${money(r.balance)}?`) && pay.mutate(r.courierId)}>Выплатить</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
