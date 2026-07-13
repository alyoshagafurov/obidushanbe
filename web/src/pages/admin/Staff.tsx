import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PHONE_REGEX } from '@obi/shared';
import { getCouriers, getOperators, getCashiers, createStaff, setStaffActive } from '../../api';
import { apiError } from '../../lib/api';
import { Spinner, ErrorBox, Empty, Stars } from '../../components/ui';
import { useToast } from '../../components/Toast';

type Tab = 'COURIER' | 'OPERATOR' | 'CASHIER';
const TABS: { v: Tab; l: string }[] = [
  { v: 'COURIER', l: 'Доставщики' }, { v: 'OPERATOR', l: 'Операторы' }, { v: 'CASHIER', l: 'Кассиры' },
];

export function Staff() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('COURIER');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ phone: '+992', name: '' });

  const key = ['staff', tab];
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => (tab === 'COURIER' ? getCouriers() : tab === 'OPERATOR' ? getOperators() : getCashiers()),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: () => createStaff({ phone: form.phone.replace(/\s/g, ''), name: form.name.trim(), role: tab }),
    onSuccess: () => { invalidate(); setOpen(false); setForm({ phone: '+992', name: '' }); toast('Сотрудник добавлен', 'success'); }, onError: (e) => toast(apiError(e), 'error'),
  });
  const toggle = useMutation({ mutationFn: (v: { id: string; isActive: boolean }) => setStaffActive(v.id, v.isActive), onSuccess: () => { invalidate(); toast('Готово', 'success'); } });

  const canAdd = PHONE_REGEX.test(form.phone.replace(/\s/g, '')) && form.name.trim().length > 0;

  return (
    <>
      <div className="page__head">
        <h1>Сотрудники</h1>
        <button className="btn" onClick={() => setOpen(true)}>+ Добавить</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => <button key={t.v} className={`chip ${tab === t.v ? 'chip--active' : ''}`} onClick={() => setTab(t.v)}>{t.l}</button>)}
      </div>

      {isLoading ? <Spinner /> : isError ? <ErrorBox message={apiError(error)} onRetry={refetch} /> :
        !data?.length ? <Empty text="Пусто" icon="👥" /> : (
          <div className="grid grid--2">
            {(data as any[]).map((s) => (
              <div className="card" key={s.id} style={{ opacity: s.isActive ? 1 : 0.6 }}>
                <div className="row-between">
                  <div>
                    <b>{s.name ?? '—'}</b>
                    <div className="hairline-muted">{s.phone}</div>
                    {'rating' in s && <div className="row" style={{ gap: 6, marginTop: 4 }}><Stars value={s.rating} size={13} /><span className="hairline-muted">{s.deliveriesCount} дост.</span></div>}
                    {!s.isActive && <div style={{ color: 'var(--warning)', fontWeight: 700, marginTop: 4 }}>⏳ Ожидает подтверждения</div>}
                  </div>
                  <button className={`btn btn--sm ${s.isActive ? 'btn--danger' : 'btn--success'}`}
                    onClick={() => toggle.mutate({ id: s.id, isActive: !s.isActive })}>
                    {s.isActive ? 'Заблокировать' : 'Подтвердить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить: {TABS.find((t) => t.v === tab)!.l}</h3>
            <div className="field" style={{ marginTop: 12 }}><label className="label">Телефон</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label className="label">Имя</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <button className="btn btn--block" disabled={!canAdd || add.isPending} onClick={() => add.mutate()}>Сохранить</button>
            <button className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>Отмена</button>
          </div>
        </div>
      )}
    </>
  );
}
