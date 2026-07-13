import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayroll, setRate } from '../../api';
import { apiError } from '../../lib/api';
import { Spinner, ErrorBox, Empty } from '../../components/ui';

export function Rates() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['rates'], queryFn: () => getPayroll() });
  const [edits, setEdits] = useState<Record<string, string>>({});
  useEffect(() => { if (data) { const n: Record<string, string> = {}; data.forEach((r) => (n[r.courierId] = r.rate.toFixed(2))); setEdits(n); } }, [data]);

  const mut = useMutation({
    mutationFn: (v: { courierId: string; rate: number }) => setRate(v.courierId, v.rate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rates'] }); qc.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: (e) => alert(apiError(e)),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message={apiError(error)} onRetry={refetch} />;

  return (
    <>
      <div className="page__head"><h1>Ставки за бутыль</h1></div>
      {!data?.length ? <Empty text="Нет доставщиков" icon="🚚" /> : (
        <div className="grid grid--2">
          {data.map((r) => {
            const val = edits[r.courierId] ?? r.rate.toFixed(2);
            const num = parseFloat(val.replace(',', '.')) || 0;
            const changed = Math.abs(num - r.rate) > 0.001;
            return (
              <div className="card" key={r.courierId}>
                <b>{r.courierName}</b>
                <div className="row" style={{ gap: 10, marginTop: 10 }}>
                  <input className="input grow" inputMode="decimal" value={val}
                    onChange={(e) => setEdits((s) => ({ ...s, [r.courierId]: e.target.value.replace(/[^\d.,]/g, '') }))} />
                  <button className="btn btn--sm" disabled={!changed || mut.isPending} onClick={() => mut.mutate({ courierId: r.courierId, rate: num })}>Сохранить</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
